import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

export interface ParentDashboardResponse {
  children: {
    id: number;
    name: string;
    username: string;
    standard?: string;
    division?: string;
    course_progress: {
      course_id: number;
      course_title: string;
      progress_percentage: number;
    }[];
    pending_assignments: {
      assignment_id: number;
      assignment_title: string;
      assignment_type: string;
      created_at: Date;
    }[];
  }[];
}

// Gets parent dashboard data showing all children's progress
export const getParentDashboard = api<{ parent_id: number }, ParentDashboardResponse>(
  { expose: true, method: "GET", path: "/auth/parents/:parent_id/dashboard" },
  async ({ parent_id }) => {
    // Check if parent exists
    const parent = await authDB.queryRow`
      SELECT id FROM users WHERE id = ${parent_id} AND role = 'parent'
    `;

    if (!parent) {
      throw APIError.notFound("Parent not found");
    }

    // Get all children for this parent
    const children = await authDB.queryAll<{
      id: number;
      name: string;
      username: string;
      standard?: string;
      division?: string;
    }>`
      SELECT u.id, u.name, u.username, u.standard, u.division
      FROM users u
      JOIN parent_children pc ON u.id = pc.child_id
      WHERE pc.parent_id = ${parent_id}
      ORDER BY u.name
    `;

    const childrenWithProgress = [];

    for (const child of children) {
      // Get course progress for this child
      const courseProgress = await authDB.queryAll<{
        course_id: number;
        course_title: string;
        progress_percentage: number;
      }>`
        SELECT 
          cp.course_id, c.title as course_title, cp.progress_percentage
        FROM course_progress cp
        JOIN courses c ON cp.course_id = c.id
        WHERE cp.student_id = ${child.id}
        ORDER BY cp.updated_at DESC
      `;

      // Get pending assignments for this child
      const pendingAssignments = await authDB.queryAll<{
        assignment_id: number;
        assignment_title: string;
        assignment_type: string;
        created_at: Date;
      }>`
        SELECT 
          a.id as assignment_id, a.title as assignment_title, 
          a.type as assignment_type, a.created_at
        FROM assignments a
        WHERE a.standard = ${child.standard} AND a.division = ${child.division}
        AND NOT EXISTS (
          SELECT 1 FROM assignment_submissions s 
          WHERE s.assignment_id = a.id AND s.student_id = ${child.id}
        )
        ORDER BY a.created_at DESC
      `;

      childrenWithProgress.push({
        ...child,
        course_progress: courseProgress,
        pending_assignments: pendingAssignments
      });
    }

    return { children: childrenWithProgress };
  }
);
