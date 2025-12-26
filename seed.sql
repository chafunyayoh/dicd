-- Insert default admin user (password: admin123)
-- Password is hashed with SHA-256 + salt 'dicd_salt_2024'
INSERT OR IGNORE INTO users (email, password, full_name, role, phone, address) VALUES 
  ('admin@dicd.edu.mw', '0557bd0cfe7803ab1827e261bf4ded1a078eb31e9cc804d27d8f94b3a92842d8', 'Moses L. Khembo', 'admin', '+265 991 507 626', 'Private Bag 151, Rumphi, Mzuzu - Malawi');

-- Note: All passwords are 'admin123' for demo purposes

-- Insert sample instructors
INSERT OR IGNORE INTO users (email, password, full_name, role, phone) VALUES 
  ('instructor1@dicd.edu.mw', '0557bd0cfe7803ab1827e261bf4ded1a078eb31e9cc804d27d8f94b3a92842d8', 'Grace Banda', 'instructor', '+265 888 111 222'),
  ('instructor2@dicd.edu.mw', '0557bd0cfe7803ab1827e261bf4ded1a078eb31e9cc804d27d8f94b3a92842d8', 'John Phiri', 'instructor', '+265 888 333 444');

-- Insert sample students
INSERT OR IGNORE INTO users (email, password, full_name, role) VALUES 
  ('student1@example.com', '0557bd0cfe7803ab1827e261bf4ded1a078eb31e9cc804d27d8f94b3a92842d8', 'Chisomo Mwale', 'student'),
  ('student2@example.com', '0557bd0cfe7803ab1827e261bf4ded1a078eb31e9cc804d27d8f94b3a92842d8', 'Takondwa Kamanga', 'student');

-- Insert sample courses
INSERT OR IGNORE INTO courses (title, description, category, instructor_id, duration_weeks, status, image_url) VALUES 
  (
    'Sign Language Training - Beginner',
    'Learn the basics of sign language including expressive communication, vocabulary, facial markers, and grammar structure. Perfect for beginners wanting to communicate with the deaf community.',
    'sign_language',
    2,
    12,
    'published',
    '/static/images/sign-language.jpg'
  ),
  (
    'Braille Literacy Training',
    'Master the theory of Braille, reading and writing by touch. Develop empathy and practical skills to support visually impaired individuals.',
    'braille',
    2,
    10,
    'published',
    '/static/images/braille.jpg'
  ),
  (
    'Autism Therapy & Support',
    'Comprehensive training on supportive care and therapy for children with autism, including early detection and individualized development plans.',
    'autism_therapy',
    3,
    16,
    'published',
    '/static/images/autism.jpg'
  ),
  (
    'Early Childhood Development (ECD)',
    'Training for caregivers and educators in inclusive ECD practices with emphasis on early intervention for children with special needs.',
    'ecd',
    3,
    8,
    'published',
    '/static/images/ecd.jpg'
  ),
  (
    'Inclusive Education Practices',
    'Understanding various disabilities including hearing impairment, visual impairment, intellectual disabilities, and learning difficulties. Essential training for mainstream school teachers.',
    'inclusive_education',
    2,
    14,
    'published',
    '/static/images/inclusive-ed.jpg'
  );

-- Insert sample lessons for Sign Language course
INSERT OR IGNORE INTO lessons (course_id, title, content, order_index, duration_minutes) VALUES 
  (1, 'Introduction to Sign Language', 'Welcome to sign language training. In this lesson, we cover the history and importance of sign language in the deaf community.', 1, 30),
  (1, 'Basic Alphabet & Numbers', 'Learn to sign the alphabet (A-Z) and numbers (0-100). Practice fingerspelling common words.', 2, 45),
  (1, 'Common Greetings & Phrases', 'Master essential greetings: Hello, Good morning, How are you?, Thank you, and more.', 3, 40),
  (1, 'Family & Relationships', 'Sign language vocabulary for family members and describing relationships.', 4, 35);

-- Insert sample lessons for Braille course
INSERT OR IGNORE INTO lessons (course_id, title, content, order_index, duration_minutes) VALUES 
  (2, 'Introduction to Braille', 'Understanding the Braille system and its importance for visually impaired literacy.', 1, 25),
  (2, 'Braille Alphabet Basics', 'Learning the 6-dot cell system and Grade 1 Braille alphabet.', 2, 50),
  (2, 'Reading Practice', 'Developing tactile sensitivity and reading speed through guided exercises.', 3, 45);

-- Insert sample lessons for Autism Therapy course
INSERT OR IGNORE INTO lessons (course_id, title, content, order_index, duration_minutes) VALUES 
  (3, 'Understanding Autism Spectrum', 'Overview of autism spectrum disorder, characteristics, and common challenges.', 1, 40),
  (3, 'Early Detection Methods', 'Identifying early signs of autism in children and importance of early intervention.', 2, 35),
  (3, 'Communication Strategies', 'Effective communication techniques and tools for children with autism.', 3, 45);

-- Insert sample announcements
INSERT OR IGNORE INTO announcements (title, content, type, status, created_by, published_at) VALUES 
  (
    'Call for Applications - Sign Language Training Scholarship 2024',
    'DICD Inclusive College is pleased to announce scholarships for our Sign Language Training program. We are offering 10 full scholarships to deaf students from underprivileged backgrounds. The program starts in January 2024 and runs for 12 weeks. Successful applicants will receive free tuition, learning materials, and certification upon completion.',
    'call_for_application',
    'published',
    1,
    CURRENT_TIMESTAMP
  ),
  (
    'New Braille Literacy Training Centre Opening in Lilongwe',
    'We are excited to announce the opening of our new training centre in Lilongwe! This facility will provide state-of-the-art Braille literacy training and will be fully accessible for persons with visual impairments. Opening ceremony scheduled for February 2024.',
    'news',
    'published',
    1,
    CURRENT_TIMESTAMP
  );

-- Insert sample application form for the scholarship
INSERT OR IGNORE INTO application_forms (announcement_id, title, description, fields_json, status, deadline, max_applications, created_by) VALUES 
  (
    1,
    'Sign Language Training Scholarship Application Form',
    'Please fill out this form to apply for the Sign Language Training Scholarship. Ensure all information is accurate and complete.',
    '[
      {"id":"full_name","type":"text","label":"Full Name","required":true,"placeholder":"Enter your full name"},
      {"id":"email","type":"email","label":"Email Address","required":true,"placeholder":"your.email@example.com"},
      {"id":"phone","type":"tel","label":"Phone Number","required":true,"placeholder":"+265 999 000 000"},
      {"id":"date_of_birth","type":"date","label":"Date of Birth","required":true},
      {"id":"gender","type":"select","label":"Gender","required":true,"options":["Male","Female","Other"]},
      {"id":"disability_type","type":"select","label":"Type of Disability","required":true,"options":["Deaf","Hard of Hearing","Other"]},
      {"id":"education_level","type":"select","label":"Highest Education Level","required":true,"options":["Primary","Secondary","Tertiary","None"]},
      {"id":"reason","type":"textarea","label":"Why do you want to learn sign language?","required":true,"placeholder":"Tell us about your motivation..."},
      {"id":"financial_situation","type":"textarea","label":"Describe your financial situation","required":true,"placeholder":"Explain why you need this scholarship..."},
      {"id":"documents","type":"file","label":"Supporting Documents","required":true,"accept":".pdf,.jpg,.png","multiple":true,"help":"Upload ID, disability certificate, and proof of income (if any)"}
    ]',
    'active',
    '2024-01-31 23:59:59',
    10,
    1
  );
