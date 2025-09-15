import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { Course } from "./types";

export interface CreateCourseRequest {
  title: string;
  description?: string;
  duration?: string;
  file_path?: string;
  file_type?: string;
  created_by: number;
}

export interface UpdateCourseRequest {
  id: number;
  title?: string;
  description?: string;
  duration?: string;
  file_path?: string;
  file_type?: string;
}

export interface GetCoursesResponse {
  courses: Course[];
}

// Creates a new course
export const createCourse = api<CreateCourseRequest, Course>(
  { expose: true, method: "POST", path: "/auth/courses" },
  async (req) => {
    const course = await authDB.queryRow<Course>`
      INSERT INTO courses (title, description, duration, file_path, file_type, created_by)
      VALUES (${req.title}, ${req.description}, ${req.duration}, ${req.file_path}, ${req.file_type}, ${req.created_by})
      RETURNING id, title, description, duration, file_path, file_type, created_by, created_at, updated_at
    `;

    if (!course) {
      throw APIError.internal("Failed to create course");
    }

    return course;
  }
);

// Gets all courses
export const getCourses = api<void, GetCoursesResponse>(
  { expose: true, method: "GET", path: "/auth/courses" },
  async () => {
    const courses = await authDB.queryAll<Course>`
      SELECT id, title, description, duration, file_path, file_type, created_by, created_at, updated_at
      FROM courses 
      ORDER BY created_at DESC
    `;

    return { courses };
  }
);

// Updates a course
export const updateCourse = api<UpdateCourseRequest, Course>(
  { expose: true, method: "PUT", path: "/auth/courses/:id" },
  async ({ id, ...updates }) => {
    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push("title = $" + (updateValues.length + 1));
      updateValues.push(updates.title);
    }
    if (updates.description !== undefined) {
      updateFields.push("description = $" + (updateValues.length + 1));
      updateValues.push(updates.description);
    }
    if (updates.duration !== undefined) {
      updateFields.push("duration = $" + (updateValues.length + 1));
      updateValues.push(updates.duration);
    }
    if (updates.file_path !== undefined) {
      updateFields.push("file_path = $" + (updateValues.length + 1));
      updateValues.push(updates.file_path);
    }
    if (updates.file_type !== undefined) {
      updateFields.push("file_type = $" + (updateValues.length + 1));
      updateValues.push(updates.file_type);
    }

    if (updateFields.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updateFields.push("updated_at = NOW()");
    updateValues.push(id);

    const query = `
      UPDATE courses 
      SET ${updateFields.join(", ")} 
      WHERE id = $${updateValues.length}
      RETURNING id, title, description, duration, file_path, file_type, created_by, created_at, updated_at
    `;

    const course = await authDB.rawQueryRow<Course>(query, ...updateValues);

    if (!course) {
      throw APIError.notFound("Course not found");
    }

    return course;
  }
);

// Deletes a course and all related data
export const deleteCourse = api<{ id: number }, { success: boolean }>(
  { expose: true, method: "DELETE", path: "/auth/courses/:id" },
  async ({ id }) => {
    // Check if the course exists first
    const courseExists = await authDB.queryRow`
      SELECT id FROM courses WHERE id = ${id}
    `;

    if (!courseExists) {
      throw APIError.notFound("Course not found");
    }

    // Delete the course - CASCADE constraints will handle related data automatically
    const result = await authDB.query`
      DELETE FROM courses WHERE id = ${id}
    `;

    return { success: true };
  }
);
