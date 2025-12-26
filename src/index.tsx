import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Simple password hashing (in production, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'dicd_salt_2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Verify session token
async function verifySession(c: any): Promise<any> {
  const token = getCookie(c, 'session_token')
  if (!token) return null

  try {
    const decoded = JSON.parse(atob(token))
    if (decoded.exp < Date.now()) return null
    
    const user = await c.env.DB.prepare(
      'SELECT id, email, full_name, role FROM users WHERE id = ?'
    ).bind(decoded.userId).first()
    
    return user
  } catch {
    return null
  }
}

// Create session token
function createSession(userId: number, role: string): string {
  const payload = {
    userId,
    role,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  }
  return btoa(JSON.stringify(payload))
}

// ============================================
// API ROUTES - AUTHENTICATION
// ============================================

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    const hashedPassword = await hashPassword(password)

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND password = ?'
    ).bind(email, hashedPassword).first()

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const token = createSession(user.id, user.role)
    setCookie(c, 'session_token', token, {
      path: '/',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60
    })

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    })
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, full_name, phone } = await c.req.json()
    
    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existing) {
      return c.json({ error: 'Email already registered' }, 400)
    }

    const hashedPassword = await hashPassword(password)

    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, hashedPassword, full_name, phone || null, 'student').run()

    const userId = result.meta.last_row_id

    const token = createSession(userId, 'student')
    setCookie(c, 'session_token', token, {
      path: '/',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60
    })

    return c.json({
      success: true,
      user: {
        id: userId,
        email,
        full_name,
        role: 'student'
      }
    })
  } catch (error) {
    return c.json({ error: 'Registration failed' }, 500)
  }
})

app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'session_token')
  return c.json({ success: true })
})

app.get('/api/auth/me', async (c) => {
  const user = await verifySession(c)
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401)
  }
  return c.json({ user })
})

// ============================================
// API ROUTES - COURSES
// ============================================

app.get('/api/courses', async (c) => {
  try {
    const status = c.req.query('status') || 'published'
    const category = c.req.query('category')

    let query = 'SELECT c.*, u.full_name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.status = ?'
    const params = [status]

    if (category) {
      query += ' AND c.category = ?'
      params.push(category)
    }

    query += ' ORDER BY c.created_at DESC'

    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ courses: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch courses' }, 500)
  }
})

app.get('/api/courses/:id', async (c) => {
  try {
    const courseId = c.req.param('id')

    const course = await c.env.DB.prepare(
      'SELECT c.*, u.full_name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.id = ?'
    ).bind(courseId).first()

    if (!course) {
      return c.json({ error: 'Course not found' }, 404)
    }

    const { results: lessons } = await c.env.DB.prepare(
      'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index'
    ).bind(courseId).all()

    return c.json({ course, lessons })
  } catch (error) {
    return c.json({ error: 'Failed to fetch course' }, 500)
  }
})

app.post('/api/courses', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const { title, description, category, duration_weeks, image_url } = await c.req.json()

    const result = await c.env.DB.prepare(
      'INSERT INTO courses (title, description, category, instructor_id, duration_weeks, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(title, description, category, user.id, duration_weeks, image_url || null, 'draft').run()

    return c.json({ success: true, courseId: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Failed to create course' }, 500)
  }
})

app.put('/api/courses/:id', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const courseId = c.req.param('id')
    const { title, description, category, duration_weeks, image_url, status } = await c.req.json()

    await c.env.DB.prepare(
      'UPDATE courses SET title = ?, description = ?, category = ?, duration_weeks = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(title, description, category, duration_weeks, image_url, status, courseId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update course' }, 500)
  }
})

app.delete('/api/courses/:id', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const courseId = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(courseId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete course' }, 500)
  }
})

// ============================================
// API ROUTES - LESSONS
// ============================================

app.post('/api/lessons', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const { course_id, title, content, video_url, order_index, duration_minutes } = await c.req.json()

    const result = await c.env.DB.prepare(
      'INSERT INTO lessons (course_id, title, content, video_url, order_index, duration_minutes) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(course_id, title, content, video_url || null, order_index, duration_minutes).run()

    return c.json({ success: true, lessonId: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Failed to create lesson' }, 500)
  }
})

app.put('/api/lessons/:id', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const lessonId = c.req.param('id')
    const { title, content, video_url, order_index, duration_minutes } = await c.req.json()

    await c.env.DB.prepare(
      'UPDATE lessons SET title = ?, content = ?, video_url = ?, order_index = ?, duration_minutes = ? WHERE id = ?'
    ).bind(title, content, video_url, order_index, duration_minutes, lessonId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update lesson' }, 500)
  }
})

app.delete('/api/lessons/:id', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const lessonId = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(lessonId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete lesson' }, 500)
  }
})

// ============================================
// API ROUTES - ENROLLMENTS
// ============================================

app.get('/api/enrollments', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { results } = await c.env.DB.prepare(
      'SELECT e.*, c.title as course_title, c.category, c.image_url FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ? ORDER BY e.enrolled_at DESC'
    ).bind(user.id).all()

    return c.json({ enrollments: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch enrollments' }, 500)
  }
})

app.post('/api/enrollments', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { course_id } = await c.req.json()

    // Check if already enrolled
    const existing = await c.env.DB.prepare(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?'
    ).bind(user.id, course_id).first()

    if (existing) {
      return c.json({ error: 'Already enrolled in this course' }, 400)
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)'
    ).bind(user.id, course_id).run()

    return c.json({ success: true, enrollmentId: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Failed to enroll' }, 500)
  }
})

// ============================================
// API ROUTES - ADMIN
// ============================================

app.get('/api/admin/stats', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const totalStudents = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    ).first()

    const totalCourses = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM courses'
    ).first()

    const totalEnrollments = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM enrollments'
    ).first()

    const totalInstructors = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role = 'instructor'"
    ).first()

    return c.json({
      students: totalStudents.count,
      courses: totalCourses.count,
      enrollments: totalEnrollments.count,
      instructors: totalInstructors.count
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})

app.get('/api/admin/users', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const { results } = await c.env.DB.prepare(
      'SELECT id, email, full_name, role, phone, created_at FROM users ORDER BY created_at DESC'
    ).all()

    return c.json({ users: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// ============================================
// API ROUTES - CONTACT
// ============================================

app.post('/api/contact', async (c) => {
  try {
    const { name, email, phone, subject, message } = await c.req.json()

    await c.env.DB.prepare(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, email, phone || null, subject || null, message).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to send message' }, 500)
  }
})

app.get('/api/admin/contacts', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM contact_messages ORDER BY created_at DESC'
    ).all()

    return c.json({ messages: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch messages' }, 500)
  }
})

// ============================================
// API ROUTES - ADOPT A LEARNER
// ============================================

app.post('/api/adoptions', async (c) => {
  try {
    const { sponsor_name, sponsor_email, sponsor_phone, student_id, amount, frequency, notes } = await c.req.json()

    const result = await c.env.DB.prepare(
      'INSERT INTO adoptions (sponsor_name, sponsor_email, sponsor_phone, student_id, amount, frequency, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(sponsor_name, sponsor_email, sponsor_phone || null, student_id, amount, frequency, notes || null).run()

    return c.json({ success: true, adoptionId: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Failed to create adoption' }, 500)
  }
})

app.get('/api/admin/adoptions', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const { results } = await c.env.DB.prepare(
      'SELECT a.*, u.full_name as student_name, u.email as student_email FROM adoptions a JOIN users u ON a.student_id = u.id ORDER BY a.start_date DESC'
    ).all()

    return c.json({ adoptions: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch adoptions' }, 500)
  }
})

// ============================================
// HTML PAGES
// ============================================

// Home Page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DICD Inclusive College - Empowering Abilities. Transforming Lives.</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .hero-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <i class="fas fa-graduation-cap text-3xl text-purple-600 mr-3"></i>
                        <span class="font-bold text-xl text-gray-800">DICD Inclusive College</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-gray-700 hover:text-purple-600">Home</a>
                        <a href="/courses" class="text-gray-700 hover:text-purple-600">Courses</a>
                        <a href="/services" class="text-gray-700 hover:text-purple-600">Services</a>
                        <a href="/about" class="text-gray-700 hover:text-purple-600">About</a>
                        <a href="/contact" class="text-gray-700 hover:text-purple-600">Contact</a>
                        <a href="/login" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Login</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section with Video Background -->
        <div class="relative h-screen min-h-[600px] overflow-hidden">
            <!-- Background Video -->
            <video 
                autoplay 
                loop 
                muted 
                playsinline
                class="absolute inset-0 w-full h-full object-cover"
            >
                <source src="/static/videos/bg1.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            
            <!-- Overlay for better text readability -->
            <div class="absolute inset-0 bg-black bg-opacity-50"></div>
            
            <!-- Content on top of video -->
            <div class="relative z-10 h-full flex items-center justify-center">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h1 class="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
                        Empowering Abilities. Transforming Lives.
                    </h1>
                    <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-lg">
                        DICD Inclusive College provides inclusive education, vocational training, and psychosocial support
                        for persons with disabilities and vulnerable groups across Malawi.
                    </p>
                    <div class="space-x-4">
                        <a href="/courses" class="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block shadow-lg transform hover:scale-105 transition-transform">
                            Browse Courses
                        </a>
                        <a href="/register" class="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 inline-block shadow-lg transform hover:scale-105 transition-transform">
                            Get Started
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mission & Vision -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-lg shadow-md">
                    <div class="text-purple-600 text-4xl mb-4">
                        <i class="fas fa-eye"></i>
                    </div>
                    <h2 class="text-2xl font-bold mb-4">Our Vision</h2>
                    <p class="text-gray-700">
                        To be a leading institution in the provision of inclusive education and empowerment services for
                        persons with disabilities—enhancing self-reliance, business opportunity, employment access,
                        and communication through inclusive education.
                    </p>
                </div>
                <div class="bg-white p-8 rounded-lg shadow-md">
                    <div class="text-purple-600 text-4xl mb-4">
                        <i class="fas fa-bullseye"></i>
                    </div>
                    <h2 class="text-2xl font-bold mb-4">Our Mission</h2>
                    <p class="text-gray-700">
                        To empower persons with disabilities and the vulnerable by creating job opportunities,
                        promoting inclusive education, training in sign language and Braille, and enhancing
                        self-reliance and entrepreneurship.
                    </p>
                </div>
            </div>
        </div>

        <!-- Programs Overview -->
        <div class="bg-gray-100 py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-3xl font-bold text-center mb-12">Our Programs</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-purple-600 text-5xl mb-4">
                            <i class="fas fa-sign-language"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Sign Language Training</h3>
                        <p class="text-gray-600">
                            Learn expressive sign language, vocabulary, facial markers, and grammar structure.
                        </p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-purple-600 text-5xl mb-4">
                            <i class="fas fa-braille"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Braille Literacy</h3>
                        <p class="text-gray-600">
                            Master reading and writing by touch to support visually impaired individuals.
                        </p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-purple-600 text-5xl mb-4">
                            <i class="fas fa-puzzle-piece"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Autism Therapy</h3>
                        <p class="text-gray-600">
                            Supportive care and therapy for children with autism and developmental plans.
                        </p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-purple-600 text-5xl mb-4">
                            <i class="fas fa-child"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Early Childhood Development</h3>
                        <p class="text-gray-600">
                            Training caregivers in inclusive ECD practices and early intervention.
                        </p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-purple-600 text-5xl mb-4">
                            <i class="fas fa-universal-access"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Inclusive Education</h3>
                        <p class="text-gray-600">
                            Understanding various disabilities and training for mainstream school teachers.
                        </p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-purple-600 text-5xl mb-4">
                            <i class="fas fa-hands-helping"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Adopt a Learner</h3>
                        <p class="text-gray-600">
                            Sponsor hearing or visually impaired children through their education journey.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- CTA Section with Video Background -->
        <div class="relative py-24 overflow-hidden">
            <!-- Video Background -->
            <video autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover">
                <source src="/static/videos/bg.mp4" type="video/mp4">
            </video>
            
            <!-- Dark Overlay -->
            <div class="absolute inset-0 bg-black bg-opacity-60"></div>
            
            <!-- Content -->
            <div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                <h2 class="text-4xl font-bold mb-4">Join Us in Making a Difference</h2>
                <p class="text-xl mb-8">
                    Whether by sponsoring a child, enrolling in a training course, or funding our programs—you can
                    be the reason someone is empowered today.
                </p>
                <div class="space-x-4">
                    <a href="/contact" class="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block transform hover:scale-105 transition">
                        Get In Touch
                    </a>
                    <a href="/donate" class="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 inline-block transform hover:scale-105 transition">
                        <i class="fas fa-heart mr-2"></i>Donate Now
                    </a>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-3 gap-8">
                    <div>
                        <h3 class="text-xl font-bold mb-4">Contact Us</h3>
                        <p><i class="fas fa-user mr-2"></i>Moses L. Khembo</p>
                        <p><i class="fas fa-phone mr-2"></i>+265 991 507 626</p>
                        <p><i class="fas fa-phone mr-2"></i>+265 880 271 451</p>
                        <p><i class="fas fa-envelope mr-2"></i>moseskhembo27@gmail.com</p>
                        <p><i class="fas fa-map-marker-alt mr-2"></i>Private Bag 151, Rumphi, Mzuzu - Malawi</p>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold mb-4">Quick Links</h3>
                        <ul class="space-y-2">
                            <li><a href="/" class="hover:text-purple-400">Home</a></li>
                            <li><a href="/courses" class="hover:text-purple-400">Courses</a></li>
                            <li><a href="/about" class="hover:text-purple-400">About Us</a></li>
                            <li><a href="/contact" class="hover:text-purple-400">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold mb-4">Our Motto</h3>
                        <p class="italic">"Disability is not inability – let's focus on ability not disability."</p>
                    </div>
                </div>
                <div class="border-t border-gray-700 mt-8 pt-8 text-center">
                    <p>&copy; 2024 DICD Inclusive College. All rights reserved.</p>
                </div>
            </div>
        </footer>
    </body>
    </html>
  `)
})

// Login Page - Continue in next part...
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - DICD Inclusive College</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-lg">
                <div class="text-center">
                    <i class="fas fa-graduation-cap text-5xl text-purple-600 mb-4"></i>
                    <h2 class="text-3xl font-bold text-gray-900">Sign in to DICD</h2>
                    <p class="mt-2 text-gray-600">Access your learning portal</p>
                </div>
                <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"></div>
                <form id="login-form" class="mt-8 space-y-6">
                    <div class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                            <input id="email" name="email" type="email" required 
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                        </div>
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                            <input id="password" name="password" type="password" required 
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                        </div>
                    </div>
                    <button type="submit" 
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none">
                        <span id="btn-text">Sign in</span>
                        <span id="btn-loading" class="hidden">
                            <i class="fas fa-spinner fa-spin"></i> Signing in...
                        </span>
                    </button>
                </form>
                <div class="text-center">
                    <p class="text-sm text-gray-600">
                        Don't have an account? 
                        <a href="/register" class="font-medium text-purple-600 hover:text-purple-500">Register here</a>
                    </p>
                    <p class="text-sm text-gray-600 mt-2">
                        <a href="/" class="text-purple-600 hover:text-purple-500">Back to Home</a>
                    </p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('login-form').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const btnText = document.getElementById('btn-text')
                const btnLoading = document.getElementById('btn-loading')
                const errorMsg = document.getElementById('error-message')
                
                btnText.classList.add('hidden')
                btnLoading.classList.remove('hidden')
                errorMsg.classList.add('hidden')

                try {
                    const response = await axios.post('/api/auth/login', {
                        email: document.getElementById('email').value,
                        password: document.getElementById('password').value
                    })

                    if (response.data.success) {
                        const role = response.data.user.role
                        if (role === 'admin') {
                            window.location.href = '/admin/dashboard'
                        } else if (role === 'instructor') {
                            window.location.href = '/instructor/dashboard'
                        } else {
                            window.location.href = '/student/dashboard'
                        }
                    }
                } catch (error) {
                    errorMsg.textContent = error.response?.data?.error || 'Login failed'
                    errorMsg.classList.remove('hidden')
                    btnText.classList.remove('hidden')
                    btnLoading.classList.add('hidden')
                }
            })
        </script>
    </body>
    </html>
  `)
})

export default app

// Register Page
app.get('/register', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - DICD Inclusive College</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-lg">
            <div class="text-center">
                <i class="fas fa-graduation-cap text-5xl text-purple-600 mb-4"></i>
                <h2 class="text-3xl font-bold text-gray-900">Join DICD</h2>
                <p class="mt-2 text-gray-600">Create your student account</p>
            </div>
            <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"></div>
            <form id="register-form" class="mt-8 space-y-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Full Name</label>
                        <input id="full_name" type="text" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Email address</label>
                        <input id="email" type="email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Phone (optional)</label>
                        <input id="phone" type="tel" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Password</label>
                        <input id="password" type="password" required minlength="6" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input id="confirm_password" type="password" required minlength="6" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                </div>
                <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
                    <span id="btn-text">Create Account</span>
                    <span id="btn-loading" class="hidden"><i class="fas fa-spinner fa-spin"></i> Creating...</span>
                </button>
            </form>
            <div class="text-center">
                <p class="text-sm text-gray-600">Already have an account? <a href="/login" class="font-medium text-purple-600 hover:text-purple-500">Sign in</a></p>
            </div>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault()
            const password = document.getElementById('password').value
            const confirmPassword = document.getElementById('confirm_password').value
            const btnText = document.getElementById('btn-text')
            const btnLoading = document.getElementById('btn-loading')
            const errorMsg = document.getElementById('error-message')
            
            errorMsg.classList.add('hidden')
            if (password !== confirmPassword) {
                errorMsg.textContent = 'Passwords do not match'
                errorMsg.classList.remove('hidden')
                return
            }
            btnText.classList.add('hidden')
            btnLoading.classList.remove('hidden')
            try {
                const response = await axios.post('/api/auth/register', {
                    full_name: document.getElementById('full_name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    password: password
                })
                if (response.data.success) {
                    window.location.href = '/student/dashboard'
                }
            } catch (error) {
                errorMsg.textContent = error.response?.data?.error || 'Registration failed'
                errorMsg.classList.remove('hidden')
                btnText.classList.remove('hidden')
                btnLoading.classList.add('hidden')
            }
        })
    </script>
</body>
</html>
  `)
})

// Student Dashboard
app.get('/student/dashboard', async (c) => {
  const user = await verifySession(c)
  if (!user || user.role !== 'student') {
    return c.redirect('/login')
  }
  // Redirect to static HTML file served by serveStatic
  return c.redirect('/static/student-dashboard.html')
})

// Admin Dashboard
app.get('/admin/dashboard', async (c) => {
  const user = await verifySession(c)
  if (!user || user.role !== 'admin') {
    return c.redirect('/login')
  }
  // Redirect to static HTML file served by serveStatic
  return c.redirect('/static/admin-dashboard.html')
})

// Instructor Dashboard (similar to admin but limited)
app.get('/instructor/dashboard', async (c) => {
  const user = await verifySession(c)
  if (!user || user.role !== 'instructor') {
    return c.redirect('/login')
  }
  // Redirect to static HTML file served by serveStatic
  return c.redirect('/static/admin-dashboard.html')
})


// Courses Page
app.get('/courses', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Courses - DICD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <i class="fas fa-graduation-cap text-3xl text-purple-600 mr-3"></i>
                    <span class="font-bold text-xl text-gray-800">DICD Inclusive College</span>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-700 hover:text-purple-600">Home</a>
                    <a href="/courses" class="text-purple-600 font-semibold">Courses</a>
                    <a href="/services" class="text-gray-700 hover:text-purple-600">Services</a>
                    <a href="/about" class="text-gray-700 hover:text-purple-600">About</a>
                    <a href="/contact" class="text-gray-700 hover:text-purple-600">Contact</a>
                    <a href="/login" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Login</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-4xl font-bold mb-8 text-center">Our Courses</h1>
        
        <div class="mb-8 flex justify-center">
            <select id="category-filter" onchange="loadCourses()" class="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All Categories</option>
                <option value="sign_language">Sign Language</option>
                <option value="braille">Braille Literacy</option>
                <option value="autism_therapy">Autism Therapy</option>
                <option value="ecd">Early Childhood Development</option>
                <option value="inclusive_education">Inclusive Education</option>
            </select>
        </div>

        <div id="courses-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
    </div>

    <footer class="bg-gray-800 text-white py-12 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; 2024 DICD Inclusive College. All rights reserved.</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        async function loadCourses() {
            try {
                const category = document.getElementById('category-filter').value
                const url = category ? '/api/courses?category=' + category : '/api/courses'
                const response = await axios.get(url)
                const courses = response.data.courses

                const html = courses.map(course => \`
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div class="h-48 bg-gradient-to-r from-purple-400 to-indigo-500"></div>
                        <div class="p-6">
                            <h3 class="text-2xl font-bold mb-2">\${course.title}</h3>
                            <p class="text-gray-600 mb-4">\${course.description || ''}</p>
                            <div class="text-sm text-gray-500 mb-2">
                                <i class="fas fa-user mr-1"></i>\${course.instructor_name || 'TBA'}
                            </div>
                            <div class="text-sm text-gray-500 mb-4">
                                <i class="fas fa-clock mr-1"></i>\${course.duration_weeks} weeks
                            </div>
                            <a href="/register" class="block w-full text-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                Enroll Now
                            </a>
                        </div>
                    </div>
                \`).join('')

                document.getElementById('courses-grid').innerHTML = html || '<p class="col-span-3 text-center text-gray-500">No courses available</p>'
            } catch (error) {
                console.error('Failed to load courses', error)
            }
        }

        loadCourses()
    </script>
</body>
</html>
  `)
})

// About Page
app.get('/about', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us - DICD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <i class="fas fa-graduation-cap text-3xl text-purple-600 mr-3"></i>
                    <span class="font-bold text-xl text-gray-800">DICD Inclusive College</span>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-700 hover:text-purple-600">Home</a>
                    <a href="/courses" class="text-gray-700 hover:text-purple-600">Courses</a>
                    <a href="/services" class="text-gray-700 hover:text-purple-600">Services</a>
                    <a href="/about" class="text-purple-600 font-semibold">About</a>
                    <a href="/contact" class="text-gray-700 hover:text-purple-600">Contact</a>
                    <a href="/login" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Login</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-4xl font-bold mb-8 text-center">About DICD Inclusive College</h1>

        <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 class="text-2xl font-bold mb-4">Who We Are</h2>
            <p class="text-gray-700 mb-4">
                DICD is a team of committed educators, counselors, and disability advocates working together to
                build an inclusive society where everyone can thrive—regardless of their physical or mental challenges.
            </p>
            <p class="text-gray-700">
                We believe that every person has potential, and we work to unlock it through education, support, and opportunity.
            </p>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 class="text-2xl font-bold mb-4">Our Expertise</h2>
            <ul class="space-y-3">
                <li class="flex items-start">
                    <i class="fas fa-check-circle text-purple-600 mt-1 mr-3"></i>
                    <span>Sign Language Training & Interpretation</span>
                </li>
                <li class="flex items-start">
                    <i class="fas fa-check-circle text-purple-600 mt-1 mr-3"></i>
                    <span>Braille Literacy & Mobility Training</span>
                </li>
                <li class="flex items-start">
                    <i class="fas fa-check-circle text-purple-600 mt-1 mr-3"></i>
                    <span>Inclusive Education and Learning Support</span>
                </li>
                <li class="flex items-start">
                    <i class="fas fa-check-circle text-purple-600 mt-1 mr-3"></i>
                    <span>Autism and Early Childhood Development (ECD) Therapy</span>
                </li>
                <li class="flex items-start">
                    <i class="fas fa-check-circle text-purple-600 mt-1 mr-3"></i>
                    <span>Counseling and Psychosocial Services</span>
                </li>
            </ul>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 class="text-2xl font-bold mb-4">Why DICD is Necessary</h2>
            <p class="text-gray-700 mb-4">
                Across Malawi, thousands of people with disabilities face exclusion from education, employment,
                and healthcare due to a lack of communication tools, inclusive training, and disability-sensitive services.
            </p>
            <div class="bg-purple-50 border-l-4 border-purple-600 p-4 mt-4">
                <p class="font-semibold mb-2">Specific Barriers We Address:</p>
                <ul class="list-disc list-inside space-y-2 text-gray-700">
                    <li>Deaf children cannot access education unless sign language is widely taught</li>
                    <li>Visually impaired individuals face limited literacy opportunities</li>
                    <li>Disabled persons struggle to access services without trained interpreters</li>
                </ul>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold mb-4">Our Impact - Aligned to SDGs</h2>
            <div class="space-y-4">
                <div>
                    <h3 class="font-bold text-purple-600">SDG 1: No Poverty</h3>
                    <p class="text-gray-700">
                        We equip persons with disabilities with vocational and business skills that enable them
                        to generate income and become self-reliant.
                    </p>
                </div>
                <div>
                    <h3 class="font-bold text-purple-600">SDG 4: Quality Education for All</h3>
                    <p class="text-gray-700">
                        We promote inclusive and equitable education by training teachers, caregivers, and
                        communities in supporting learners with disabilities.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <footer class="bg-gray-800 text-white py-12 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; 2024 DICD Inclusive College. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
  `)
})

// Contact Page
app.get('/contact', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us - DICD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <i class="fas fa-graduation-cap text-3xl text-purple-600 mr-3"></i>
                    <span class="font-bold text-xl text-gray-800">DICD Inclusive College</span>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-700 hover:text-purple-600">Home</a>
                    <a href="/courses" class="text-gray-700 hover:text-purple-600">Courses</a>
                    <a href="/services" class="text-gray-700 hover:text-purple-600">Services</a>
                    <a href="/about" class="text-gray-700 hover:text-purple-600">About</a>
                    <a href="/contact" class="text-purple-600 font-semibold">Contact</a>
                    <a href="/login" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Login</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-4xl font-bold mb-8 text-center">Get In Touch</h1>

        <div class="grid md:grid-cols-2 gap-8">
            <div class="bg-white rounded-lg shadow-lg p-8">
                <h2 class="text-2xl font-bold mb-6">Contact Information</h2>
                <div class="space-y-4">
                    <div class="flex items-start">
                        <i class="fas fa-user text-purple-600 mt-1 mr-4 text-xl"></i>
                        <div>
                            <p class="font-semibold">Moses L. Khembo</p>
                            <p class="text-gray-600">Founder & Director</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-phone text-purple-600 mt-1 mr-4 text-xl"></i>
                        <div>
                            <p>+265 991 507 626</p>
                            <p>+265 880 271 451</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-envelope text-purple-600 mt-1 mr-4 text-xl"></i>
                        <div>
                            <p>moseskhembo27@gmail.com</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-map-marker-alt text-purple-600 mt-1 mr-4 text-xl"></i>
                        <div>
                            <p>Private Bag 151</p>
                            <p>Rumphi, Mzuzu</p>
                            <p>Malawi</p>
                        </div>
                    </div>
                </div>

                <div class="mt-8 p-4 bg-purple-50 rounded-lg">
                    <p class="font-semibold mb-2">Training Locations:</p>
                    <ul class="list-disc list-inside text-gray-700">
                        <li>Blantyre Training Centre</li>
                        <li>Dowa (Dzaleka) Training Centre</li>
                        <li>Rumphi Training Centre</li>
                    </ul>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-8">
                <h2 class="text-2xl font-bold mb-6">Send Us a Message</h2>
                <div id="success-message" class="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"></div>
                <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"></div>
                <form id="contact-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                        <input id="name" type="text" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input id="email" type="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                        <input id="phone" type="tel" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input id="subject" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea id="message" rows="4" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
                    </div>
                    <button type="submit" class="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold">
                        <span id="btn-text">Send Message</span>
                        <span id="btn-loading" class="hidden"><i class="fas fa-spinner fa-spin"></i> Sending...</span>
                    </button>
                </form>
            </div>
        </div>
    </div>

    <footer class="bg-gray-800 text-white py-12 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; 2024 DICD Inclusive College. All rights reserved.</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        document.getElementById('contact-form').addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const btnText = document.getElementById('btn-text')
            const btnLoading = document.getElementById('btn-loading')
            const errorMsg = document.getElementById('error-message')
            const successMsg = document.getElementById('success-message')
            
            btnText.classList.add('hidden')
            btnLoading.classList.remove('hidden')
            errorMsg.classList.add('hidden')
            successMsg.classList.add('hidden')

            try {
                await axios.post('/api/contact', {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    subject: document.getElementById('subject').value,
                    message: document.getElementById('message').value
                })

                successMsg.textContent = 'Message sent successfully! We will get back to you soon.'
                successMsg.classList.remove('hidden')
                document.getElementById('contact-form').reset()
            } catch (error) {
                errorMsg.textContent = 'Failed to send message. Please try again.'
                errorMsg.classList.remove('hidden')
            } finally {
                btnText.classList.remove('hidden')
                btnLoading.classList.add('hidden')
            }
        })
    </script>
</body>
</html>
  `)
})


// Services Page
app.get('/services', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Our Services - DICD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <i class="fas fa-graduation-cap text-3xl text-purple-600 mr-3"></i>
                    <span class="font-bold text-xl text-gray-800">DICD Inclusive College</span>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-700 hover:text-purple-600">Home</a>
                    <a href="/courses" class="text-gray-700 hover:text-purple-600">Courses</a>
                    <a href="/services" class="text-purple-600 font-semibold">Services</a>
                    <a href="/about" class="text-gray-700 hover:text-purple-600">About</a>
                    <a href="/contact" class="text-gray-700 hover:text-purple-600">Contact</a>
                    <a href="/login" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Login</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-4xl font-bold mb-4 text-center">Our Services</h1>
        <p class="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            DICD provides comprehensive vocational training and support services for persons with disabilities,
            empowering them with practical skills and opportunities for self-reliance.
        </p>

        <!-- Vocational Training Section -->
        <div class="mb-16">
            <h2 class="text-3xl font-bold mb-8 text-purple-600">
                <i class="fas fa-tools mr-3"></i>Vocational Training Programs
            </h2>
            <p class="text-gray-700 mb-8">
                We train people with different abilities in various practical skills, preparing them for employment
                and entrepreneurship opportunities.
            </p>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Carpentry and Joinery -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-hammer"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Carpentry & Joinery</h3>
                    <p class="text-gray-600">
                        Learn woodworking skills including furniture making, door and window construction,
                        and general carpentry techniques.
                    </p>
                </div>

                <!-- Tailoring -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-cut"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Tailoring</h3>
                    <p class="text-gray-600">
                        Master garment design, cutting, sewing, and fashion creation. Learn to operate
                        industrial and domestic sewing machines.
                    </p>
                </div>

                <!-- Welding and Fabrication -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-industry"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Welding & Fabrication</h3>
                    <p class="text-gray-600">
                        Gain expertise in metal working, welding techniques, and fabrication of metal
                        structures and products.
                    </p>
                </div>

                <!-- Brick Laying -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-building"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Brick Laying</h3>
                    <p class="text-gray-600">
                        Learn construction skills including bricklaying, plastering, and basic building
                        techniques for residential and commercial structures.
                    </p>
                </div>

                <!-- Electrical Installation -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Electrical Installation</h3>
                    <p class="text-gray-600">
                        Study electrical wiring, circuit installation, maintenance, and safety procedures
                        for residential and industrial applications.
                    </p>
                </div>
            </div>
        </div>

        <!-- Support Services Section -->
        <div class="mb-16">
            <h2 class="text-3xl font-bold mb-8 text-purple-600">
                <i class="fas fa-hands-helping mr-3"></i>Support & Therapeutic Services
            </h2>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Physiotherapy -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-heartbeat"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Physiotherapy Services</h3>
                    <p class="text-gray-600">
                        Professional physiotherapy treatment and rehabilitation services for persons
                        with physical disabilities and mobility challenges.
                    </p>
                </div>

                <!-- Braille Training -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-braille"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Braille Training</h3>
                    <p class="text-gray-600">
                        Comprehensive training in Braille reading and writing for visually impaired
                        individuals and support staff.
                    </p>
                </div>

                <!-- Sign Language Training -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-sign-language"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Sign Language Training</h3>
                    <p class="text-gray-600">
                        Learn sign language communication for the deaf community, including expressive
                        and receptive signing skills.
                    </p>
                </div>

                <!-- Inclusive Education -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-universal-access"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Inclusive Education Training</h3>
                    <p class="text-gray-600">
                        Training educators and institutions on inclusive teaching practices and
                        accommodations for learners with disabilities.
                    </p>
                </div>

                <!-- Counseling Services -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-comments"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Counseling Services</h3>
                    <p class="text-gray-600">
                        Professional counseling and psychosocial support for individuals and families
                        dealing with disability-related challenges.
                    </p>
                </div>

                <!-- Disability Awareness -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Disability Awareness</h3>
                    <p class="text-gray-600">
                        Conducting awareness campaigns and training in different sectors about disability
                        inclusion and rights.
                    </p>
                </div>
            </div>
        </div>

        <!-- Artisan & Craft Services Section -->
        <div class="mb-16">
            <h2 class="text-3xl font-bold mb-8 text-purple-600">
                <i class="fas fa-paint-brush mr-3"></i>Artisan & Craft Services
            </h2>
            <p class="text-gray-700 mb-8">
                We provide training and production services in various artistic and craft activities,
                creating income-generating opportunities.
            </p>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Bracelet Making -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-gem"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Bracelet Making</h3>
                    <p class="text-gray-600">
                        Learn to create beautiful handcrafted bracelets using various materials and
                        techniques for commercial purposes.
                    </p>
                </div>

                <!-- Crochet -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-tshirt"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Crochet</h3>
                    <p class="text-gray-600">
                        Master crochet techniques to create clothing items, accessories, and decorative
                        pieces for personal use or sale.
                    </p>
                </div>

                <!-- Knitting -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-5xl mb-4">
                        <i class="fas fa-mitten"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Knitting</h3>
                    <p class="text-gray-600">
                        Learn professional knitting skills for producing sweaters, scarves, blankets,
                        and other knitted products.
                    </p>
                </div>
            </div>
        </div>

        <!-- Call to Action -->
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-xl p-12 text-center">
            <h2 class="text-3xl font-bold mb-4">Interested in Our Services?</h2>
            <p class="text-xl mb-8 max-w-2xl mx-auto">
                Whether you want to enroll in a training program or learn more about our support services,
                we're here to help you achieve your goals.
            </p>
            <div class="space-x-4">
                <a href="/register" class="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block">
                    Register Now
                </a>
                <a href="/contact" class="bg-purple-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-900 inline-block">
                    Contact Us
                </a>
            </div>
        </div>
    </div>

    <footer class="bg-gray-800 text-white py-12 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-3 gap-8">
                <div>
                    <h3 class="text-xl font-bold mb-4">Contact Us</h3>
                    <p><i class="fas fa-user mr-2"></i>Moses L. Khembo</p>
                    <p><i class="fas fa-phone mr-2"></i>+265 991 507 626</p>
                    <p><i class="fas fa-phone mr-2"></i>+265 880 271 451</p>
                    <p><i class="fas fa-envelope mr-2"></i>moseskhembo27@gmail.com</p>
                    <p><i class="fas fa-map-marker-alt mr-2"></i>Private Bag 151, Rumphi, Mzuzu - Malawi</p>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-4">Quick Links</h3>
                    <ul class="space-y-2">
                        <li><a href="/" class="hover:text-purple-400">Home</a></li>
                        <li><a href="/courses" class="hover:text-purple-400">Courses</a></li>
                        <li><a href="/services" class="hover:text-purple-400">Services</a></li>
                        <li><a href="/about" class="hover:text-purple-400">About Us</a></li>
                        <li><a href="/contact" class="hover:text-purple-400">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-4">Our Motto</h3>
                    <p class="italic">"Disability is not inability – let's focus on ability not disability."</p>
                </div>
            </div>
            <div class="border-t border-gray-700 mt-8 pt-8 text-center">
                <p>&copy; 2024 DICD Inclusive College. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>
  `)
})


// ============================================
// API ROUTES - DONATIONS
// ============================================

// Create donation intent
app.post('/api/donations/create', async (c) => {
  try {
    const { donor_name, donor_email, donor_phone, amount, message, is_anonymous } = await c.req.json()
    
    // For demo purposes, we'll simulate successful payment
    // In production, integrate with Stripe API
    const result = await c.env.DB.prepare(
      'INSERT INTO donations (donor_name, donor_email, donor_phone, amount, message, is_anonymous, status, stripe_payment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      is_anonymous ? 'Anonymous' : donor_name,
      donor_email,
      donor_phone || null,
      amount,
      message || null,
      is_anonymous ? 1 : 0,
      'completed',
      'demo_' + Date.now()
    ).run()

    return c.json({ 
      success: true, 
      donationId: result.meta.last_row_id,
      message: 'Thank you for your generous donation!'
    })
  } catch (error) {
    return c.json({ error: 'Failed to process donation' }, 500)
  }
})

// Get all donations (admin only)
app.get('/api/admin/donations', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM donations ORDER BY created_at DESC'
    ).all()

    return c.json({ donations: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch donations' }, 500)
  }
})

// Get donation statistics
app.get('/api/admin/donation-stats', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const total = await c.env.DB.prepare(
      "SELECT COUNT(*) as count, SUM(amount) as total FROM donations WHERE status = 'completed'"
    ).first()

    return c.json({
      totalDonations: total.count,
      totalAmount: total.total || 0
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})

// ============================================
// API ROUTES - ANNOUNCEMENTS
// ============================================

// Get all published announcements
app.get('/api/announcements', async (c) => {
  try {
    const type = c.req.query('type')
    
    let query = "SELECT a.*, u.full_name as author_name FROM announcements a LEFT JOIN users u ON a.created_by = u.id WHERE a.status = 'published'"
    const params = []

    if (type) {
      query += ' AND a.type = ?'
      params.push(type)
    }

    query += ' ORDER BY a.published_at DESC'

    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ announcements: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch announcements' }, 500)
  }
})

// Get single announcement
app.get('/api/announcements/:id', async (c) => {
  try {
    const announcementId = c.req.param('id')

    const announcement = await c.env.DB.prepare(
      'SELECT a.*, u.full_name as author_name FROM announcements a LEFT JOIN users u ON a.created_by = u.id WHERE a.id = ?'
    ).bind(announcementId).first()

    if (!announcement) {
      return c.json({ error: 'Announcement not found' }, 404)
    }

    return c.json({ announcement })
  } catch (error) {
    return c.json({ error: 'Failed to fetch announcement' }, 500)
  }
})

// Create announcement (admin only)
app.post('/api/announcements', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const { title, content, type, status, expires_at } = await c.req.json()

    const published_at = status === 'published' ? new Date().toISOString() : null

    const result = await c.env.DB.prepare(
      'INSERT INTO announcements (title, content, type, status, published_at, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(title, content, type, status, published_at, expires_at || null, user.id).run()

    return c.json({ success: true, announcementId: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Failed to create announcement' }, 500)
  }
})

// Update announcement (admin only)
app.put('/api/announcements/:id', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const announcementId = c.req.param('id')
    const { title, content, type, status, expires_at } = await c.req.json()

    await c.env.DB.prepare(
      'UPDATE announcements SET title = ?, content = ?, type = ?, status = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(title, content, type, status, expires_at || null, announcementId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update announcement' }, 500)
  }
})

// Delete announcement (admin only)
app.delete('/api/announcements/:id', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const announcementId = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM announcements WHERE id = ?').bind(announcementId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete announcement' }, 500)
  }
})

// ============================================
// API ROUTES - APPLICATION FORMS
// ============================================

// Get all application forms
app.get('/api/forms', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT f.*, a.title as announcement_title FROM application_forms f LEFT JOIN announcements a ON f.announcement_id = a.id WHERE f.status = 'active' ORDER BY f.created_at DESC"
    ).all()

    return c.json({ forms: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch forms' }, 500)
  }
})

// Get form by ID
app.get('/api/forms/:id', async (c) => {
  try {
    const formId = c.req.param('id')

    const form = await c.env.DB.prepare(
      'SELECT f.*, a.title as announcement_title FROM application_forms f LEFT JOIN announcements a ON f.announcement_id = a.id WHERE f.id = ?'
    ).bind(formId).first()

    if (!form) {
      return c.json({ error: 'Form not found' }, 404)
    }

    return c.json({ form })
  } catch (error) {
    return c.json({ error: 'Failed to fetch form' }, 500)
  }
})

// Create application form (admin only)
app.post('/api/forms', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const { announcement_id, title, description, fields, deadline, max_applications } = await c.req.json()

    const result = await c.env.DB.prepare(
      'INSERT INTO application_forms (announcement_id, title, description, fields_json, deadline, max_applications, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(announcement_id || null, title, description, JSON.stringify(fields), deadline, max_applications || null, user.id).run()

    return c.json({ success: true, formId: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Failed to create form' }, 500)
  }
})

// Submit application
app.post('/api/applications', async (c) => {
  try {
    const { form_id, applicant_name, applicant_email, applicant_phone, form_data, document_urls } = await c.req.json()

    const user = await verifySession(c)
    const userId = user ? user.id : null

    const result = await c.env.DB.prepare(
      'INSERT INTO applications (form_id, user_id, applicant_name, applicant_email, applicant_phone, form_data_json, document_urls) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      form_id,
      userId,
      applicant_name,
      applicant_email,
      applicant_phone || null,
      JSON.stringify(form_data),
      document_urls ? JSON.stringify(document_urls) : null
    ).run()

    return c.json({ success: true, applicationId: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Failed to submit application' }, 500)
  }
})

// Get all applications (admin only)
app.get('/api/admin/applications', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const formId = c.req.query('form_id')
    
    let query = 'SELECT a.*, f.title as form_title FROM applications a JOIN application_forms f ON a.form_id = f.id'
    const params = []

    if (formId) {
      query += ' WHERE a.form_id = ?'
      params.push(formId)
    }

    query += ' ORDER BY a.created_at DESC'

    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({ applications: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch applications' }, 500)
  }
})

// Update application status (admin only)
app.put('/api/admin/applications/:id', async (c) => {
  try {
    const user = await verifySession(c)
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const applicationId = c.req.param('id')
    const { status, notes } = await c.req.json()

    await c.env.DB.prepare(
      'UPDATE applications SET status = ?, notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(status, notes || null, user.id, applicationId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update application' }, 500)
  }
})


// Donate Page
app.get('/donate', (c) => {
  return c.redirect('/static/donate.html')
})

// Announcements Page
app.get('/announcements', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Announcements - DICD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <i class="fas fa-graduation-cap text-3xl text-purple-600 mr-3"></i>
                    <span class="font-bold text-xl text-gray-800">DICD Inclusive College</span>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-700 hover:text-purple-600">Home</a>
                    <a href="/courses" class="text-gray-700 hover:text-purple-600">Courses</a>
                    <a href="/announcements" class="text-purple-600 font-semibold">Announcements</a>
                    <a href="/about" class="text-gray-700 hover:text-purple-600">About</a>
                    <a href="/contact" class="text-gray-700 hover:text-purple-600">Contact</a>
                    <a href="/login" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Login</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-4xl font-bold mb-8">Latest Announcements</h1>

        <div class="mb-6">
            <select id="type-filter" onchange="loadAnnouncements()" class="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All Types</option>
                <option value="call_for_application">Applications</option>
                <option value="news">News</option>
                <option value="event">Events</option>
                <option value="general">General</option>
            </select>
        </div>

        <div id="announcements-list" class="space-y-6"></div>
    </div>

    <footer class="bg-gray-800 text-white py-12 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; 2024 DICD Inclusive College. All rights reserved.</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        async function loadAnnouncements() {
            try {
                const type = document.getElementById('type-filter').value
                const url = type ? \`/api/announcements?type=\${type}\` : '/api/announcements'
                const response = await axios.get(url)
                const announcements = response.data.announcements

                const html = announcements.map(ann => \`
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="flex justify-between items-start mb-3">
                            <span class="px-3 py-1 text-sm rounded-full \${getTypeBadge(ann.type)}">\${formatType(ann.type)}</span>
                            <span class="text-sm text-gray-500">\${new Date(ann.published_at).toLocaleDateString()}</span>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">\${ann.title}</h3>
                        <p class="text-gray-700 mb-4">\${ann.content}</p>
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas fa-user mr-2"></i>
                            <span>Posted by \${ann.author_name || 'DICD Admin'}</span>
                        </div>
                        \${ann.type === 'call_for_application' ? \`
                            <div class="mt-4">
                                <a href="/applications?announcement=\${ann.id}" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 inline-block">
                                    <i class="fas fa-file-alt mr-2"></i>Apply Now
                                </a>
                            </div>
                        \` : ''}
                    </div>
                \`).join('')

                document.getElementById('announcements-list').innerHTML = html || '<p class="text-center text-gray-500">No announcements available</p>'
            } catch (error) {
                console.error('Failed to load announcements', error)
            }
        }

        function getTypeBadge(type) {
            const badges = {
                call_for_application: 'bg-green-100 text-green-800',
                news: 'bg-blue-100 text-blue-800',
                event: 'bg-orange-100 text-orange-800',
                general: 'bg-gray-100 text-gray-800'
            }
            return badges[type] || badges.general
        }

        function formatType(type) {
            return type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())
        }

        loadAnnouncements()
    </script>
</body>
</html>
  `)
})

// Application Forms Page
app.get('/applications', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Forms - DICD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <i class="fas fa-graduation-cap text-3xl text-purple-600 mr-3"></i>
                    <span class="font-bold text-xl text-gray-800">DICD Inclusive College</span>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-700 hover:text-purple-600">Home</a>
                    <a href="/announcements" class="text-gray-700 hover:text-purple-600">Announcements</a>
                    <a href="/login" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Login</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-4xl font-bold mb-8">Application Forms</h1>

        <div id="forms-list" class="space-y-6"></div>
        
        <!-- Application Form Modal -->
        <div id="form-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
                <div class="flex justify-between items-center mb-4">
                    <h3 id="form-title" class="text-2xl font-bold"></h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <p id="form-description" class="text-gray-600 mb-6"></p>
                
                <div id="success-message" class="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"></div>
                <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"></div>
                
                <form id="application-form" class="space-y-4"></form>
            </div>
        </div>
    </div>

    <footer class="bg-gray-800 text-white py-12 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; 2024 DICD Inclusive College. All rights reserved.</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let currentForm = null

        async function loadForms() {
            try {
                const response = await axios.get('/api/forms')
                const forms = response.data.forms

                const html = forms.map(form => \`
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-2xl font-bold mb-2">\${form.title}</h3>
                        <p class="text-gray-600 mb-4">\${form.description || ''}</p>
                        <div class="flex justify-between items-center text-sm text-gray-600 mb-4">
                            <span><i class="fas fa-calendar mr-2"></i>Deadline: \${new Date(form.deadline).toLocaleDateString()}</span>
                            \${form.max_applications ? \`<span><i class="fas fa-users mr-2"></i>Max: \${form.max_applications} applicants</span>\` : ''}
                        </div>
                        <button onclick="openForm(\${form.id})" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                            <i class="fas fa-file-alt mr-2"></i>Apply Now
                        </button>
                    </div>
                \`).join('')

                document.getElementById('forms-list').innerHTML = html || '<p class="text-center text-gray-500">No application forms available</p>'
            } catch (error) {
                console.error('Failed to load forms', error)
            }
        }

        async function openForm(formId) {
            try {
                const response = await axios.get(\`/api/forms/\${formId}\`)
                currentForm = response.data.form
                
                document.getElementById('form-title').textContent = currentForm.title
                document.getElementById('form-description').textContent = currentForm.description || ''
                
                const fields = JSON.parse(currentForm.fields_json)
                const formHtml = fields.map(field => renderField(field)).join('') + \`
                    <button type="submit" class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold mt-4">
                        <span id="btn-text">Submit Application</span>
                        <span id="btn-loading" class="hidden"><i class="fas fa-spinner fa-spin"></i> Submitting...</span>
                    </button>
                \`
                
                document.getElementById('application-form').innerHTML = formHtml
                document.getElementById('form-modal').classList.remove('hidden')
                
                document.getElementById('application-form').onsubmit = submitApplication
            } catch (error) {
                alert('Failed to load form')
            }
        }

        function renderField(field) {
            const required = field.required ? 'required' : ''
            const label = field.label + (field.required ? ' *' : '')
            
            switch(field.type) {
                case 'text':
                case 'email':
                case 'tel':
                case 'date':
                    return \`
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">\${label}</label>
                            <input id="\${field.id}" type="\${field.type}" \${required} placeholder="\${field.placeholder || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                        </div>
                    \`
                case 'textarea':
                    return \`
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">\${label}</label>
                            <textarea id="\${field.id}" rows="4" \${required} placeholder="\${field.placeholder || ''}"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
                        </div>
                    \`
                case 'select':
                    return \`
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">\${label}</label>
                            <select id="\${field.id}" \${required} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                                <option value="">Select...</option>
                                \${field.options.map(opt => \`<option value="\${opt}">\${opt}</option>\`).join('')}
                            </select>
                        </div>
                    \`
                case 'file':
                    return \`
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">\${label}</label>
                            \${field.help ? \`<p class="text-sm text-gray-500 mb-2">\${field.help}</p>\` : ''}
                            <input id="\${field.id}" type="file" \${required} accept="\${field.accept || '*'}" \${field.multiple ? 'multiple' : ''}
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none">
                            <p class="text-xs text-gray-500 mt-1">Note: File upload is simulated in demo mode</p>
                        </div>
                    \`
                default:
                    return ''
            }
        }

        async function submitApplication(e) {
            e.preventDefault()
            
            const btnText = document.getElementById('btn-text')
            const btnLoading = document.getElementById('btn-loading')
            const errorMsg = document.getElementById('error-message')
            const successMsg = document.getElementById('success-message')
            
            btnText.classList.add('hidden')
            btnLoading.classList.remove('hidden')
            errorMsg.classList.add('hidden')
            successMsg.classList.add('hidden')

            try {
                const fields = JSON.parse(currentForm.fields_json)
                const formData = {}
                
                fields.forEach(field => {
                    const element = document.getElementById(field.id)
                    if (element) {
                        formData[field.id] = element.value
                    }
                })

                const response = await axios.post('/api/applications', {
                    form_id: currentForm.id,
                    applicant_name: formData.full_name || formData.name,
                    applicant_email: formData.email,
                    applicant_phone: formData.phone,
                    form_data: formData,
                    document_urls: [] // Simulated
                })

                if (response.data.success) {
                    successMsg.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Application submitted successfully! We will review your application and contact you soon.'
                    successMsg.classList.remove('hidden')
                    document.getElementById('application-form').reset()
                    
                    setTimeout(() => {
                        closeModal()
                    }, 3000)
                }
            } catch (error) {
                errorMsg.textContent = error.response?.data?.error || 'Failed to submit application'
                errorMsg.classList.remove('hidden')
            } finally {
                btnText.classList.remove('hidden')
                btnLoading.classList.add('hidden')
            }
        }

        function closeModal() {
            document.getElementById('form-modal').classList.add('hidden')
            currentForm = null
        }

        loadForms()
    </script>
</body>
</html>
  `)
})

