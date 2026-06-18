import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()
app.use('*', cors({ credentials: true, origin: '*' }))

// Utility functions
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'dicd_salt_2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifySession(c: any): Promise<any> {
  const token = getCookie(c, 'session_token')
  if (!token) return null
  try {
    const decoded = JSON.parse(atob(token))
    if (decoded.exp < Date.now()) return null
    return await c.env.DB.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').bind(decoded.userId).first()
  } catch { return null }
}

function createSession(userId: number, role: string): string {
  return btoa(JSON.stringify({ userId, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }))
}

// Auth routes
app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json()
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND password = ?')
    .bind(email, await hashPassword(password)).first()
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)
  setCookie(c, 'session_token', createSession(user.id, user.role), { path: '/', httpOnly: true, maxAge: 604800 })
  return c.json({ success: true, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } })
})

app.post('/auth/register', async (c) => {
  const { email, password, full_name, phone } = await c.req.json()
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) return c.json({ error: 'Email already registered' }, 400)
  const result = await c.env.DB.prepare('INSERT INTO users (email, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?)')
    .bind(email, await hashPassword(password), full_name, phone || null, 'student').run()
  const userId = result.meta.last_row_id
  setCookie(c, 'session_token', createSession(userId, 'student'), { path: '/', httpOnly: true, maxAge: 604800 })
  return c.json({ success: true, user: { id: userId, email, full_name, role: 'student' } })
})

app.post('/auth/logout', (c) => {
  deleteCookie(c, 'session_token')
  return c.json({ success: true })
})

// Courses
app.get('/courses', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT c.*, u.full_name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.status = ? ORDER BY c.created_at DESC').bind('published').all()
  return c.json({ courses: results })
})

app.get('/courses/:id', async (c) => {
  const course = await c.env.DB.prepare('SELECT c.*, u.full_name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.id = ?').bind(c.req.param('id')).first()
  if (!course) return c.json({ error: 'Course not found' }, 404)
  const { results: lessons } = await c.env.DB.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index').bind(c.req.param('id')).all()
  return c.json({ course, lessons })
})

// Enrollments
app.post('/enrollments', async (c) => {
  const user = await verifySession(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { course_id } = await c.req.json()
  await c.env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)').bind(user.id, course_id).run()
  return c.json({ success: true })
})

app.get('/enrollments/my-courses', async (c) => {
  const user = await verifySession(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { results } = await c.env.DB.prepare('SELECT e.*, c.title as course_title FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ?').bind(user.id).all()
  return c.json({ enrollments: results })
})

// Admin
app.get('/admin/stats', async (c) => {
  const user = await verifySession(c)
  if (!user || (user.role !== 'admin' && user.role !== 'instructor')) return c.json({ error: 'Unauthorized' }, 403)
  const students = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").first()
  const courses = await c.env.DB.prepare('SELECT COUNT(*) as count FROM courses').first()
  const enrollments = await c.env.DB.prepare('SELECT COUNT(*) as count FROM enrollments').first()
  const instructors = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'instructor'").first()
  return c.json({ students: students.count, courses: courses.count, enrollments: enrollments.count, instructors: instructors.count })
})

// Announcements
app.get('/announcements', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM announcements WHERE status = 'published' ORDER BY created_at DESC").all()
  return c.json({ announcements: results })
})

// Contact
app.post('/contact', async (c) => {
  const { name, email, subject, message } = await c.req.json()
  await c.env.DB.prepare('INSERT INTO contact_submissions (name, email, subject, message) VALUES (?, ?, ?, ?)').bind(name, email, subject, message).run()
  return c.json({ success: true })
})

// Forms
app.get('/forms', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM application_forms WHERE status = 'active' ORDER BY created_at DESC").all()
  return c.json({ forms: results })
})

export default { fetch: app.fetch }
