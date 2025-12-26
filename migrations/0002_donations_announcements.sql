-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT DEFAULT 'card',
  stripe_payment_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
  message TEXT,
  is_anonymous BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK(type IN ('general', 'call_for_application', 'news', 'event')),
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  published_at DATETIME,
  expires_at DATETIME,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Application forms table
CREATE TABLE IF NOT EXISTS application_forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  fields_json TEXT NOT NULL, -- JSON array of form fields
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed', 'archived')),
  deadline DATETIME,
  max_applications INTEGER,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Application submissions table
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id INTEGER NOT NULL,
  user_id INTEGER,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  form_data_json TEXT NOT NULL, -- JSON object of form responses
  document_urls TEXT, -- JSON array of uploaded document URLs
  status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'under_review', 'accepted', 'rejected')),
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES application_forms(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(donor_email);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_applications_form_id ON applications(form_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
