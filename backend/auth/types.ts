export interface User {
  id: number;
  username: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  name: string;
  email?: string;
  phone_number: string;
  standard?: string;
  division?: string;
  parent_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  duration?: string;
  file_path?: string;
  file_type?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface Assignment {
  id: number;
  title: string;
  type: 'quiz' | 'written' | 'upload';
  standard: string;
  division: string;
  created_by: number;
  content?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  content?: string;
  file_path?: string;
  submitted_at: Date;
}

export interface CourseProgress {
  id: number;
  course_id: number;
  student_id: number;
  progress_percentage: number;
  completed_at?: Date;
  updated_at: Date;
}

export interface LoginLog {
  id: number;
  user_id: number;
  login_time: Date;
}

export interface ParentChild {
  id: number;
  parent_id: number;
  child_id: number;
  created_at: Date;
}

export interface OTP {
  id: number;
  phone_number: string;
  otp_code: string;
  created_at: Date;
  expires_at: Date;
  used: boolean;
}
