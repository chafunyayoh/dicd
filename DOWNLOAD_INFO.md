# DICD E-Learning Platform - Download & Installation Guide

## 📦 Download Complete Project

### Option 1: Download ZIP Archive
**Direct Download Link:** https://www.genspark.ai/api/files/s/VdY4Z5zB

**File Details:**
- **Filename:** dicd-elearning-complete-backup.tar.gz
- **Size:** ~23 MB
- **Format:** TAR.GZ archive
- **Includes:** Full source code, documentation, migrations, and assets

**How to Extract:**
```bash
# Linux/Mac
tar -xzf dicd-elearning-complete-backup.tar.gz

# Windows (use 7-Zip or WinRAR)
# Right-click > Extract Here
```

### Option 2: Clone from GitHub
**Repository:** https://github.com/chafunyayoh/dicd

```bash
git clone https://github.com/chafunyayoh/dicd.git
cd dicd
```

---

## 🚀 Installation Instructions

### Prerequisites
- **Node.js** 18+ (Download from https://nodejs.org/)
- **npm** or **pnpm** (comes with Node.js)
- **Wrangler CLI** (Cloudflare tool - will be installed with dependencies)

### Step 1: Install Dependencies
```bash
cd webapp  # or 'cd dicd' if cloned from GitHub
npm install
```

### Step 2: Initialize Database
```bash
# Apply database migrations
npx wrangler d1 execute dicd-production --local --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute dicd-production --local --file=./migrations/0002_donations_announcements.sql

# Load sample data (optional but recommended)
npx wrangler d1 execute dicd-production --local --file=./seed.sql
```

### Step 3: Build the Project
```bash
npm run build
```

### Step 4: Start Development Server
```bash
# Option A: Using PM2 (recommended for production-like environment)
pm2 start ecosystem.config.cjs

# Option B: Using Wrangler directly
npx wrangler pages dev dist --d1=dicd-production --local --port 3000
```

### Step 5: Access the Website
Open your browser and navigate to:
- **Local URL:** http://localhost:3000
- **Public URL (if deployed):** See deployment section below

---

## 🔑 Default Login Credentials

### Admin Account
- **Email:** admin@dicd.edu.mw
- **Password:** admin123
- **Access:** Full admin dashboard, course management, user management

### Instructor Account
- **Email:** instructor1@dicd.edu.mw
- **Password:** admin123
- **Access:** Instructor dashboard, course management

### Student Account
- **Email:** student1@example.com
- **Password:** admin123
- **Access:** Student portal, course enrollment, progress tracking

---

## 📁 Project Structure

```
webapp/
├── src/
│   └── index.tsx              # Main application (Hono backend + all routes)
├── public/
│   └── static/
│       ├── images/
│       │   └── dicd-logo.png  # DICD logo
│       ├── videos/
│       │   ├── bg.mp4         # Background video 1
│       │   └── bg1.mp4        # Background video 2
│       ├── admin-dashboard.html
│       ├── student-dashboard.html
│       ├── donate.html
│       └── pages.js
├── migrations/
│   ├── 0001_initial_schema.sql          # Database schema
│   └── 0002_donations_announcements.sql # Additional features
├── seed.sql                   # Sample data
├── package.json               # Dependencies
├── wrangler.jsonc            # Cloudflare configuration
├── vite.config.ts            # Build configuration
├── ecosystem.config.cjs      # PM2 configuration
├── README.md                 # Project overview
├── TESTING_GUIDE.md          # Testing instructions
├── COMPLETE_FEATURE_SUMMARY.md # Feature documentation
└── DOWNLOAD_INFO.md          # This file
```

---

## 🌐 Deployment to Cloudflare Pages

### Prerequisites
1. **Cloudflare Account** (Free tier available at https://cloudflare.com)
2. **Wrangler CLI** authenticated with your account

### Deploy Steps

#### 1. Login to Cloudflare
```bash
npx wrangler login
```

#### 2. Create Production D1 Database
```bash
# Create the database
npx wrangler d1 create dicd-production

# Copy the database_id from the output and update wrangler.jsonc
```

#### 3. Update wrangler.jsonc
```jsonc
{
  "name": "dicd-elearning",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "dicd-production",
      "database_id": "YOUR_DATABASE_ID_HERE"  // Replace with actual ID
    }
  ]
}
```

#### 4. Apply Migrations to Production Database
```bash
npx wrangler d1 migrations apply dicd-production
npx wrangler d1 execute dicd-production --file=./seed.sql
```

#### 5. Deploy to Cloudflare Pages
```bash
npm run build
npx wrangler pages deploy dist --project-name dicd-elearning
```

#### 6. Access Your Live Site
After deployment, Cloudflare will provide a URL like:
- `https://dicd-elearning.pages.dev`

---

## 📚 Features Included

### ✅ Public Features
- **Homepage** with video background and organization information
- **Courses Catalog** with filtering and search
- **About Page** with mission, vision, and organizational structure
- **Contact Page** with contact form
- **Services Page** with all DICD programs
- **Announcements** with calls for applications
- **Donation System** with secure payment integration
- **Application Forms** with document upload

### ✅ Authentication System
- User registration (students, instructors)
- Secure login with SHA-256 password hashing
- HTTP-only cookie sessions
- Role-based access control (Admin, Instructor, Student)

### ✅ Admin Dashboard
- User management (view, create, edit, delete)
- Course management (create, edit, publish, delete)
- Analytics (student count, enrollments, courses)
- Announcements management
- Application review system
- Donation tracking
- "Adopt a Learner" program management

### ✅ Student Portal
- Browse available courses
- Enroll in courses with one click
- Track course progress
- View enrolled courses
- Personal dashboard

### ✅ Instructor Dashboard
- View assigned courses
- Manage course content
- Track student enrollments

### ✅ Database (Cloudflare D1)
- 11 database tables
- Full migration system
- Sample seed data included
- SQLite-based (local) and D1 (production)

### ✅ Responsive Design
- Mobile-first approach
- Fully responsive on all devices
- Hamburger menu for mobile
- Optimized for phone, tablet, desktop

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start development server (Vite)
npm run dev

# Start development server (Wrangler - matches production)
npm run dev:sandbox

# Deploy to Cloudflare Pages
npm run deploy

# Database commands
npm run db:migrate:local      # Apply migrations locally
npm run db:migrate:prod       # Apply migrations to production
npm run db:seed               # Load seed data
npm run db:reset              # Reset local database

# Git commands
npm run git:status            # Check git status
npm run git:commit "message"  # Commit changes
```

---

## 📖 Documentation

- **README.md** - Project overview and quick start
- **TESTING_GUIDE.md** - Complete testing instructions with all endpoints
- **COMPLETE_FEATURE_SUMMARY.md** - Detailed feature documentation
- **DOWNLOAD_INFO.md** - This file (installation and deployment guide)

---

## 🐛 Troubleshooting

### Issue: Port 3000 already in use
```bash
# Kill process on port 3000
fuser -k 3000/tcp  # Linux/Mac
netstat -ano | findstr :3000  # Windows (find PID, then kill it)
```

### Issue: Database errors
```bash
# Reset and rebuild database
npm run db:reset
```

### Issue: Build errors
```bash
# Clear cache and rebuild
rm -rf dist .wrangler node_modules/.vite
npm run build
```

### Issue: Login not working
- Make sure database migrations are applied
- Check that seed.sql has been loaded
- Default password is `admin123` for all default accounts

---

## 📞 Support & Contact

**Organization:** Disability Initiative for Counselling and Development (DICD)
**Contact Person:** Moses L. Khembo
**Phone:** +265 991 507 626 / +265 880 271 451
**Email:** moseskhembo27@gmail.com
**Address:** Private Bag 151, Rumphi, Mzuzu - Malawi

**GitHub Repository:** https://github.com/chafunyayoh/dicd
**Live Demo:** https://3000-iaadd53jr537ynuy767d3-0e616f0a.sandbox.novita.ai

---

## 📄 License

This project is developed for DICD Inclusive College. All rights reserved.

---

## 🎉 Thank You!

Thank you for using the DICD E-Learning Platform! We hope this system helps empower persons with disabilities through inclusive education and training.

**"Empowering Abilities. Transforming Lives."**
