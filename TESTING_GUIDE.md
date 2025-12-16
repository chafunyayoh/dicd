# DICD E-Learning Platform - Testing Guide

## 🔗 Access URLs

### Development Server
- **URL**: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai
- **Status**: ✅ Running

## 👥 Test Accounts

### Admin Account
- **Email**: admin@dicd.edu.mw
- **Password**: admin123
- **Access**: Full system access, course management, user management

### Instructor Accounts
- **Email**: instructor1@dicd.edu.mw or instructor2@dicd.edu.mw
- **Password**: admin123
- **Access**: Create and manage courses, view students

### Student Accounts
- **Email**: student1@example.com or student2@example.com
- **Password**: admin123
- **Access**: Browse and enroll in courses, track progress

## 🧪 Test Scenarios

### 1. Public Pages (No Login Required)

#### Home Page
- Visit: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai
- ✅ Check: Navigation menu, hero section, programs overview, footer

#### Courses Page
- Visit: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai/courses
- ✅ Check: Course listings, category filter, course details
- **Test Filter**: Select different categories (Sign Language, Braille, etc.)

#### About Page
- Visit: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai/about
- ✅ Check: Organization info, expertise areas, SDG alignment

#### Contact Page
- Visit: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai/contact
- ✅ Check: Contact form, organization details
- **Test**: Submit a message and verify success

### 2. Authentication Flow

#### Registration
1. Visit: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai/register
2. Fill in the form with new user details
3. ✅ Check: Account created, redirected to student dashboard

#### Login
1. Visit: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai/login
2. Use test credentials from above
3. ✅ Check: Redirected to appropriate dashboard based on role

#### Logout
1. Click "Logout" button from any dashboard
2. ✅ Check: Redirected to login page, session cleared

### 3. Student Portal Testing

**Login as**: student1@example.com / admin123

#### Dashboard
- Visit: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai/student/dashboard
- ✅ Check: Welcome message, My Courses tab, Browse Courses tab

#### Browse and Enroll
1. Switch to "Browse Courses" tab
2. View available courses
3. Click "Enroll Now" on any course
4. ✅ Check: Enrollment successful, course appears in "My Courses"

#### View Enrolled Courses
1. Switch to "My Courses" tab
2. ✅ Check: Progress bar, course details, "Continue Learning" button

#### Course Filtering
1. In "Browse Courses" tab, use category dropdown
2. ✅ Check: Courses filtered correctly

### 4. Admin Dashboard Testing

**Login as**: admin@dicd.edu.mw / admin123

#### Statistics Overview
- Visit: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai/admin/dashboard
- ✅ Check: Stats cards showing:
  - Total Students: 2
  - Total Courses: 5
  - Enrollments: (varies)
  - Instructors: 2

#### Course Management
1. **View Courses**: Check Courses tab
2. **Add New Course**:
   - Click "Add New Course"
   - Fill in course details
   - Select category
   - ✅ Check: Course created successfully
3. **Edit Course**: Click edit icon on any course
4. **Delete Course**: Click delete icon (admin only)

#### User Management
1. Switch to "Users" tab
2. ✅ Check: List of all users with roles
3. View user details (name, email, role, join date)

#### Contact Messages
1. Switch to "Contact Messages" tab
2. ✅ Check: Messages submitted from contact form
3. View message details and status

#### Adopt a Learner Program
1. Switch to "Adoptions" tab
2. ✅ Check: Sponsorship records
3. View sponsor and student details

### 5. Instructor Dashboard Testing

**Login as**: instructor1@dicd.edu.mw / admin123

#### Course Creation
1. Navigate to dashboard
2. ✅ Check: Similar to admin but with limited permissions
3. Create and manage own courses

## 🔌 API Testing

### Test with cURL

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dicd.edu.mw","password":"admin123"}' \
  -c cookies.txt
```

#### Get Courses
```bash
curl http://localhost:3000/api/courses
```

#### Get Admin Stats (requires authentication)
```bash
curl -b cookies.txt http://localhost:3000/api/admin/stats
```

#### Submit Contact Form
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+265999000000",
    "subject": "Testing",
    "message": "This is a test message"
  }'
```

## ✅ Feature Checklist

### Authentication ✅
- [x] User registration
- [x] User login
- [x] User logout
- [x] Session management
- [x] Role-based access control

### Student Features ✅
- [x] Browse courses
- [x] Filter by category
- [x] Enroll in courses
- [x] View enrolled courses
- [x] Track progress

### Admin Features ✅
- [x] Dashboard statistics
- [x] Course management (CRUD)
- [x] User management
- [x] View contact messages
- [x] Monitor adoptions

### Public Features ✅
- [x] Home page
- [x] About page
- [x] Contact form
- [x] Course catalog

### Database ✅
- [x] Users table
- [x] Courses table
- [x] Lessons table
- [x] Enrollments table
- [x] Contact messages table
- [x] Adoptions table

## 🐛 Known Issues

None currently identified. All features tested and working.

## 📊 Sample Data

### Courses Available:
1. **Sign Language Training - Beginner** (12 weeks)
2. **Braille Literacy Training** (10 weeks)
3. **Autism Therapy & Support** (16 weeks)
4. **Early Childhood Development (ECD)** (8 weeks)
5. **Inclusive Education Practices** (14 weeks)

### Users:
- 1 Admin (Moses L. Khembo)
- 2 Instructors (Grace Banda, John Phiri)
- 2 Students (Chisomo Mwale, Takondwa Kamanga)

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Create Cloudflare D1 production database
- [ ] Update wrangler.jsonc with production database ID
- [ ] Run migrations on production: `npm run db:migrate:prod`
- [ ] Update seed.sql or manually create admin account
- [ ] Deploy: `npm run deploy`
- [ ] Test all features on production URL
- [ ] Update README with production URL

## 📝 Notes

- All passwords in seed data are "admin123" for testing
- Password hashing uses SHA-256 with salt "dicd_salt_2024"
- Session tokens stored in HTTP-only cookies
- Static files served from `/static/` path
- Database stored locally in `.wrangler/state/v3/d1/`

## 🔧 Troubleshooting

### Issue: Login fails
**Solution**: Reset database with `npm run db:reset`

### Issue: Database not found
**Solution**: Run `npm run db:migrate:local` and `npm run db:seed`

### Issue: PM2 process not starting
**Solution**: Clean port and restart
```bash
fuser -k 3000/tcp
pm2 delete dicd-elearning
pm2 start ecosystem.config.cjs
```

### Issue: Changes not reflected
**Solution**: Rebuild and restart
```bash
npm run build
pm2 restart dicd-elearning
```

## 📞 Support

For issues or questions:
- **Email**: moseskhembo27@gmail.com
- **Phone**: +265 991 507 626

---

**Testing Status**: ✅ All features tested and working
**Last Updated**: December 16, 2024
