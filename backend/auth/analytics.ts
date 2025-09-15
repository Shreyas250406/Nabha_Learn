import { api } from "encore.dev/api";
import { authDB } from "./db";

export interface AnalyticsResponse {
  total_students: number;
  total_teachers: number;
  total_logins_this_week: number;
}

export interface StudentProgressResponse {
  students: {
    id: number;
    name: string;
    username: string;
    standard?: string;
    division?: string;
    average_completion: number;
  }[];
}

export interface BatchAnalyticsResponse {
  batches: {
    standard: string;
    division: string;
    student_count: number;
    students: {
      id: number;
      name: string;
      username: string;
      average_completion: number;
    }[];
  }[];
}

// Gets overall analytics for admin dashboard
export const getAnalytics = api<void, AnalyticsResponse>(
  { expose: true, method: "GET", path: "/auth/analytics" },
  async () => {
    // Get total students
    const studentCount = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM users WHERE role = 'student'
    `;

    // Get total teachers
    const teacherCount = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM users WHERE role = 'teacher'
    `;

    // Get logins in the last week
    const weeklyLogins = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count 
      FROM login_logs 
      WHERE login_time >= NOW() - INTERVAL '7 days'
    `;

    return {
      total_students: studentCount?.count || 0,
      total_teachers: teacherCount?.count || 0,
      total_logins_this_week: weeklyLogins?.count || 0
    };
  }
);

// Gets student progress data for Excel export
export const getStudentProgress = api<void, StudentProgressResponse>(
  { expose: true, method: "GET", path: "/auth/analytics/student-progress" },
  async () => {
    const students = await authDB.queryAll<{
      id: number;
      name: string;
      username: string;
      standard?: string;
      division?: string;
      average_completion: number;
    }>`
      SELECT 
        u.id, u.name, u.username, u.standard, u.division,
        COALESCE(AVG(cp.progress_percentage), 0) as average_completion
      FROM users u
      LEFT JOIN course_progress cp ON u.id = cp.student_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.name, u.username, u.standard, u.division
      ORDER BY u.name
    `;

    return { students };
  }
);

// Gets batch-wise analytics for teachers
export const getBatchAnalytics = api<void, BatchAnalyticsResponse>(
  { expose: true, method: "GET", path: "/auth/analytics/batches" },
  async () => {
    const batches = await authDB.queryAll<{
      standard: string;
      division: string;
      student_count: number;
    }>`
      SELECT 
        standard, division, COUNT(*) as student_count
      FROM users 
      WHERE role = 'student' AND standard IS NOT NULL AND division IS NOT NULL
      GROUP BY standard, division
      ORDER BY standard, division
    `;

    const batchesWithStudents = [];

    for (const batch of batches) {
      const students = await authDB.queryAll<{
        id: number;
        name: string;
        username: string;
        average_completion: number;
      }>`
        SELECT 
          u.id, u.name, u.username,
          COALESCE(AVG(cp.progress_percentage), 0) as average_completion
        FROM users u
        LEFT JOIN course_progress cp ON u.id = cp.student_id
        WHERE u.role = 'student' AND u.standard = ${batch.standard} AND u.division = ${batch.division}
        GROUP BY u.id, u.name, u.username
        ORDER BY u.name
      `;

      batchesWithStudents.push({
        ...batch,
        students
      });
    }

    return { batches: batchesWithStudents };
  }
);

// Updates course progress for a student
export const updateCourseProgress = api<{
  course_id: number;
  student_id: number;
  progress_percentage: number;
}, { success: boolean }>(
  { expose: true, method: "PUT", path: "/auth/progress" },
  async ({ course_id, student_id, progress_percentage }) => {
    // Check if record exists
    const existing = await authDB.queryRow`
      SELECT id FROM course_progress 
      WHERE course_id = ${course_id} AND student_id = ${student_id}
    `;

    if (existing) {
      // Update existing record
      await authDB.exec`
        UPDATE course_progress 
        SET progress_percentage = ${progress_percentage},
            completed_at = CASE WHEN ${progress_percentage} >= 100 THEN NOW() ELSE completed_at END,
            updated_at = NOW()
        WHERE course_id = ${course_id} AND student_id = ${student_id}
      `;
    } else {
      // Insert new record
      await authDB.exec`
        INSERT INTO course_progress (course_id, student_id, progress_percentage, completed_at, updated_at)
        VALUES (${course_id}, ${student_id}, ${progress_percentage}, 
                CASE WHEN ${progress_percentage} >= 100 THEN NOW() ELSE NULL END, NOW())
      `;
    }

    return { success: true };
  }
);

// Gets progress for a specific student
export const getStudentCourseProgress = api<{ student_id: number }, {
  progress: {
    course_id: number;
    course_title: string;
    progress_percentage: number;
    completed_at?: Date;
  }[];
}>(
  { expose: true, method: "GET", path: "/auth/progress/:student_id" },
  async ({ student_id }) => {
    const progress = await authDB.queryAll<{
      course_id: number;
      course_title: string;
      progress_percentage: number;
      completed_at?: Date;
    }>`
      SELECT 
        cp.course_id, c.title as course_title, 
        cp.progress_percentage, cp.completed_at
      FROM course_progress cp
      JOIN courses c ON cp.course_id = c.id
      WHERE cp.student_id = ${student_id}
      ORDER BY cp.updated_at DESC
    `;

    return { progress };
  }
);
