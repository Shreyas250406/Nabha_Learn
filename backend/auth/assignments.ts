import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { Assignment, AssignmentSubmission } from "./types";

export interface CreateAssignmentRequest {
  title: string;
  type: 'quiz' | 'written' | 'upload';
  standard: string;
  division: string;
  content?: string;
  created_by: number;
}

export interface GetAssignmentsResponse {
  assignments: Assignment[];
}

export interface SubmitAssignmentRequest {
  assignment_id: number;
  student_id: number;
  content?: string;
  file_path?: string;
}

export interface GetSubmissionsResponse {
  submissions: (AssignmentSubmission & { student_name: string; assignment_title: string })[];
}

// Creates a new assignment
export const createAssignment = api<CreateAssignmentRequest, Assignment>(
  { expose: true, method: "POST", path: "/auth/assignments" },
  async (req) => {
    const assignment = await authDB.queryRow<Assignment>`
      INSERT INTO assignments (title, type, standard, division, content, created_by)
      VALUES (${req.title}, ${req.type}, ${req.standard}, ${req.division}, ${req.content}, ${req.created_by})
      RETURNING id, title, type, standard, division, created_by, content, created_at, updated_at
    `;

    if (!assignment) {
      throw APIError.internal("Failed to create assignment");
    }

    return assignment;
  }
);

// Gets assignments for a specific class
export const getAssignmentsByClass = api<{ standard: string; division: string }, GetAssignmentsResponse>(
  { expose: true, method: "GET", path: "/auth/assignments/:standard/:division" },
  async ({ standard, division }) => {
    const assignments = await authDB.queryAll<Assignment>`
      SELECT id, title, type, standard, division, created_by, content, created_at, updated_at
      FROM assignments 
      WHERE standard = ${standard} AND division = ${division}
      ORDER BY created_at DESC
    `;

    return { assignments };
  }
);

// Gets all assignments for teachers/admins
export const getAllAssignments = api<void, GetAssignmentsResponse>(
  { expose: true, method: "GET", path: "/auth/assignments" },
  async () => {
    const assignments = await authDB.queryAll<Assignment>`
      SELECT id, title, type, standard, division, created_by, content, created_at, updated_at
      FROM assignments 
      ORDER BY created_at DESC
    `;

    return { assignments };
  }
);

// Submits an assignment
export const submitAssignment = api<SubmitAssignmentRequest, AssignmentSubmission>(
  { expose: true, method: "POST", path: "/auth/assignments/submit" },
  async (req) => {
    // Check if assignment exists
    const assignment = await authDB.queryRow`
      SELECT id FROM assignments WHERE id = ${req.assignment_id}
    `;

    if (!assignment) {
      throw APIError.notFound("Assignment not found");
    }

    // Check if student exists
    const student = await authDB.queryRow`
      SELECT id FROM users WHERE id = ${req.student_id} AND role = 'student'
    `;

    if (!student) {
      throw APIError.notFound("Student not found");
    }

    // Check if student already submitted this assignment
    const existing = await authDB.queryRow`
      SELECT id FROM assignment_submissions 
      WHERE assignment_id = ${req.assignment_id} AND student_id = ${req.student_id}
    `;

    if (existing) {
      throw APIError.alreadyExists("Assignment already submitted");
    }

    const submission = await authDB.queryRow<AssignmentSubmission>`
      INSERT INTO assignment_submissions (assignment_id, student_id, content, file_path)
      VALUES (${req.assignment_id}, ${req.student_id}, ${req.content}, ${req.file_path})
      RETURNING id, assignment_id, student_id, content, file_path, submitted_at
    `;

    if (!submission) {
      throw APIError.internal("Failed to submit assignment");
    }

    return submission;
  }
);

// Gets submissions for an assignment
export const getSubmissionsByAssignment = api<{ assignment_id: number }, GetSubmissionsResponse>(
  { expose: true, method: "GET", path: "/auth/assignments/:assignment_id/submissions" },
  async ({ assignment_id }) => {
    const submissions = await authDB.queryAll<AssignmentSubmission & { student_name: string; assignment_title: string }>`
      SELECT 
        s.id, s.assignment_id, s.student_id, s.content, s.file_path, s.submitted_at,
        u.name as student_name,
        a.title as assignment_title
      FROM assignment_submissions s
      JOIN users u ON s.student_id = u.id
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.assignment_id = ${assignment_id}
      ORDER BY s.submitted_at DESC
    `;

    return { submissions };
  }
);
