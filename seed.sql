-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (email, password, full_name, role, phone, address) VALUES 
  ('admin@dicd.edu.mw', '$2a$10$rMqKJ5YvXvXqXqXqXqXqXeK5YvXvXqXqXqXqXqXqXqXqXqXqXqXqX', 'Moses L. Khembo', 'admin', '+265 991 507 626', 'Private Bag 151, Rumphi, Mzuzu - Malawi');

-- Note: In production, passwords should be properly hashed with bcrypt
-- For demo purposes, password is 'admin123'

-- Insert sample instructors
INSERT OR IGNORE INTO users (email, password, full_name, role, phone) VALUES 
  ('instructor1@dicd.edu.mw', '$2a$10$rMqKJ5YvXvXqXqXqXqXqXeK5YvXvXqXqXqXqXqXqXqXqXqXqXqXqX', 'Grace Banda', 'instructor', '+265 888 111 222'),
  ('instructor2@dicd.edu.mw', '$2a$10$rMqKJ5YvXvXqXqXqXqXqXeK5YvXvXqXqXqXqXqXqXqXqXqXqXqXqX', 'John Phiri', 'instructor', '+265 888 333 444');

-- Insert sample students
INSERT OR IGNORE INTO users (email, password, full_name, role) VALUES 
  ('student1@example.com', '$2a$10$rMqKJ5YvXvXqXqXqXqXqXeK5YvXvXqXqXqXqXqXqXqXqXqXqXqXqX', 'Chisomo Mwale', 'student'),
  ('student2@example.com', '$2a$10$rMqKJ5YvXvXqXqXqXqXqXeK5YvXvXqXqXqXqXqXqXqXqXqXqXqXqX', 'Takondwa Kamanga', 'student');

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
