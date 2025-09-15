-- Add CASCADE DELETE constraints to handle course deletion properly

-- Drop existing foreign key constraints and recreate with CASCADE
ALTER TABLE course_progress DROP CONSTRAINT IF EXISTS course_progress_course_id_fkey;
ALTER TABLE course_progress ADD CONSTRAINT course_progress_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Also ensure assignment_submissions cascade properly if assignments reference courses in the future
ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_fkey;
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_assignment_id_fkey 
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;

-- Ensure other constraints also cascade properly
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_created_by_fkey;
ALTER TABLE assignments ADD CONSTRAINT assignments_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_created_by_fkey;
ALTER TABLE courses ADD CONSTRAINT courses_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE course_progress DROP CONSTRAINT IF EXISTS course_progress_student_id_fkey;
ALTER TABLE course_progress ADD CONSTRAINT course_progress_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_fkey;
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE login_logs DROP CONSTRAINT IF EXISTS login_logs_user_id_fkey;
ALTER TABLE login_logs ADD CONSTRAINT login_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE parent_children DROP CONSTRAINT IF EXISTS parent_children_parent_id_fkey;
ALTER TABLE parent_children ADD CONSTRAINT parent_children_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE parent_children DROP CONSTRAINT IF EXISTS parent_children_child_id_fkey;
ALTER TABLE parent_children ADD CONSTRAINT parent_children_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE;
