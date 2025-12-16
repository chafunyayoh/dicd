# DICD Inclusive College - E-Learning Platform

**Empowering Abilities. Transforming Lives.**

A complete e-learning platform for the Disability Initiative for Counselling and Development (DICD), providing inclusive education for persons with disabilities in Malawi.

## 🌐 Live URLs

- **Development**: https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai
- **Production**: (Deploy to Cloudflare Pages)

## 📋 Project Overview

DICD Inclusive College is a registered institution that promotes self-reliance, entrepreneurship, and inclusive development through education and training programs for individuals with disabilities.

### Key Features

✅ **Authentication System**
- User registration and login
- Role-based access control (Admin, Instructor, Student)
- Session management with cookies

✅ **Admin Dashboard**
- Course management (Create, Edit, Delete, Publish)
- User management and analytics
- View contact messages
- Monitor "Adopt a Learner" program
- Real-time statistics dashboard

✅ **Student Learning Portal**
- Browse and enroll in courses
- Track learning progress
- View enrolled courses
- Course categories filtering

✅ **Public Pages**
- Home page with mission and vision
- Courses catalog with filtering
- About Us page
- Contact form

✅ **Courses Available**
- Sign Language Training
- Braille Literacy Training
- Autism Therapy & Support
- Early Childhood Development (ECD)
- Inclusive Education Practices

## 🏗️ Technology Stack

- **Backend**: Hono Framework (Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Icons**: FontAwesome
- **HTTP Client**: Axios
- **Deployment**: Cloudflare Pages

## 📊 Database Schema

### Users Table
- Stores admins, instructors, and students
- Email/password authentication
- Role-based access control

### Courses Table
- Course information and metadata
- Categories: sign_language, braille, autism_therapy, ecd, inclusive_education
- Status: draft, published, archived

### Lessons Table
- Course content organized by modules
- Video URLs, duration, and ordering

### Enrollments Table
- Student course registrations
- Progress tracking
- Completion status

### Contact Messages
- Store inquiries from the contact form
- Admin can review and respond

### Adoptions
- "Adopt a Learner" sponsorship program
- Track sponsors and sponsored students

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Wrangler CLI (for Cloudflare)

### Installation

```bash
# Install dependencies
npm install

# Initialize local database
npm run db:migrate:local

# Seed database with sample data
npm run db:seed

# Build the project
npm run build

# Start development server
npm run dev:sandbox
```

### Default Admin Credentials

**Email**: admin@dicd.edu.mw  
**Password**: admin123

### Sample Instructor Credentials

**Email**: instructor1@dicd.edu.mw  
**Password**: admin123

### Sample Student Credentials

**Email**: student1@example.com  
**Password**: admin123

## 📁 Project Structure

```
webapp/
├── src/
│   └── index.tsx              # Main Hono application
├── public/
│   └── static/
│       ├── admin-dashboard.html     # Admin interface
│       ├── student-dashboard.html   # Student portal
│       └── pages.js                 # Additional page templates
├── migrations/
│   └── 0001_initial_schema.sql     # Database schema
├── seed.sql                         # Sample data
├── ecosystem.config.cjs             # PM2 configuration
├── wrangler.jsonc                   # Cloudflare configuration
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new student account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - List all courses (with filters)
- `GET /api/courses/:id` - Get course details with lessons
- `POST /api/courses` - Create course (Admin/Instructor)
- `PUT /api/courses/:id` - Update course (Admin/Instructor)
- `DELETE /api/courses/:id` - Delete course (Admin only)

### Lessons
- `POST /api/lessons` - Create lesson (Admin/Instructor)
- `PUT /api/lessons/:id` - Update lesson (Admin/Instructor)
- `DELETE /api/lessons/:id` - Delete lesson (Admin/Instructor)

### Enrollments
- `GET /api/enrollments` - Get user's enrollments
- `POST /api/enrollments` - Enroll in course

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/contacts` - View contact messages
- `GET /api/admin/adoptions` - View adoption records

### Contact & Adoptions
- `POST /api/contact` - Submit contact form
- `POST /api/adoptions` - Create adoption sponsorship

## 🎨 User Roles & Permissions

### Admin
- Full access to all features
- Manage users, courses, lessons
- View analytics and reports
- Review contact messages
- Monitor adoptions

### Instructor
- Create and manage their own courses
- Add lessons to courses
- View enrolled students

### Student
- Browse and enroll in courses
- Track learning progress
- Access course materials

## 🌍 About DICD

### Vision
To be a leading institution in the provision of inclusive education and empowerment services for persons with disabilities—enhancing self-reliance, business opportunity, employment access, and communication.

### Mission
To empower persons with disabilities and the vulnerable by:
- Creating job opportunities
- Promoting inclusive education
- Training in sign language and Braille
- Enhancing self-reliance and entrepreneurship
- Supporting lifelong learning

### Training Locations
- Blantyre Training Centre
- Dowa (Dzaleka) Training Centre
- Rumphi Training Centre

### Contact Information
**Moses L. Khembo** - Founder & Director  
📧 moseskhembo27@gmail.com  
📱 +265 991 507 626 / +265 880 271 451  
📍 Private Bag 151, Rumphi, Mzuzu - Malawi

## 🚀 Deployment to Cloudflare Pages

```bash
# Build project
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Or deploy with project name
wrangler pages deploy dist --project-name dicd-elearning
```

### Environment Variables
No environment variables needed for basic operation. All data stored in D1 database.

## 📝 Available Scripts

- `npm run dev` - Vite development server
- `npm run dev:sandbox` - Wrangler Pages dev server (for sandbox)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to Cloudflare Pages
- `npm run db:migrate:local` - Run database migrations (local)
- `npm run db:migrate:prod` - Run database migrations (production)
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset local database
- `npm run clean-port` - Kill process on port 3000
- `npm test` - Test if server is running

## 🔐 Security Notes

⚠️ **Important**: The current password hashing uses SHA-256 for simplicity. In production, use proper bcrypt hashing with:
```javascript
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash(password, 10)
const valid = await bcrypt.compare(password, hash)
```

## 🤝 Contributing

This platform was built to serve the disability community in Malawi. Contributions, suggestions, and feedback are welcome!

## 📄 License

Copyright © 2024 DICD Inclusive College. All rights reserved.

## 🙏 Acknowledgments

Built with support for persons with disabilities in Malawi, aligned with:
- UN Sustainable Development Goals (SDG 1 & 4)
- Malawi Vision 2063
- Inclusive education principles

---

**"Disability is not inability – let's focus on ability not disability."**

For more information or to get involved, visit our website or contact us directly.
