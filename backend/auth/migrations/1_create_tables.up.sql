-- Users table for all user types (admin, teacher, student, parent)
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
  name TEXT NOT NULL,
  email TEXT,
  standard TEXT,
  division TEXT,
  parent_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  file_path TEXT,
  file_type TEXT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignments table
CREATE TABLE assignments (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('quiz', 'written', 'upload')),
  standard TEXT NOT NULL,
  division TEXT NOT NULL,
  created_by BIGINT REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignment submissions table
CREATE TABLE assignment_submissions (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT REFERENCES assignments(id),
  student_id BIGINT REFERENCES users(id),
  content TEXT,
  file_path TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Course progress table
CREATE TABLE course_progress (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT REFERENCES courses(id),
  student_id BIGINT REFERENCES users(id),
  progress_percentage DOUBLE PRECISION DEFAULT 0,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Login logs table for analytics
CREATE TABLE login_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  login_time TIMESTAMP DEFAULT NOW()
);

-- Parent-child relationships
CREATE TABLE parent_children (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT REFERENCES users(id),
  child_id BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default users
INSERT INTO users (username, password, role, name, email) VALUES
('admin', 'admin123', 'admin', 'System Administrator', 'admin@nabhalearn.com'),
('teacher', 'teacher123', 'teacher', 'Default Teacher', 'teacher@nabhalearn.com'),
('student', 'student123', 'student', 'Default Student', 'student@nabhalearn.com'),
('parent', 'parent123', 'parent', 'Default Parent', 'parent@nabhalearn.com');
