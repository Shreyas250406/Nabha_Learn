import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { User } from "./types";

export interface CreateUserRequest {
  username: string;
  name: string;
  email?: string;
  phone_number: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  standard?: string;
  division?: string;
  parent_name?: string;
}

export interface CreateUserResponse {
  user: User;
  phone_number: string;
}

export interface UpdatePhoneRequest {
  user_id: number;
  new_phone_number: string;
}

export interface GetUsersResponse {
  users: User[];
}

// Creates a new user
export const createUser = api<CreateUserRequest, CreateUserResponse>(
  { expose: true, method: "POST", path: "/auth/users" },
  async (req) => {
    try {
      // Check if username already exists
      const existingUser = await authDB.queryRow`
        SELECT id FROM users WHERE LOWER(username) = ${req.username.toLowerCase()}
      `;

      if (existingUser) {
        throw APIError.alreadyExists("Username already exists");
      }

      // Ensure phone number starts with + for consistency
      const formattedPhoneForCheck = req.phone_number.trim().startsWith('+') ? req.phone_number.trim() : `+${req.phone_number.trim()}`;

      // Check if phone number already exists
      const existingPhone = await authDB.queryRow`
        SELECT id FROM users WHERE phone_number = ${formattedPhoneForCheck}
      `;

      if (existingPhone) {
        throw APIError.alreadyExists("Phone number already exists");
      }

      // Ensure phone number starts with + if not already provided
      const formattedPhone = req.phone_number.trim().startsWith('+') ? req.phone_number.trim() : `+${req.phone_number.trim()}`;

      // Insert the new user
      const user = await authDB.queryRow<User>`
        INSERT INTO users (username, role, name, email, phone_number, standard, division, parent_name)
        VALUES (${req.username.toLowerCase()}, ${req.role}, ${req.name}, ${req.email}, ${formattedPhone}, ${req.standard}, ${req.division}, ${req.parent_name})
        RETURNING id, username, role, name, email, phone_number, standard, division, parent_name, created_at, updated_at
      `;

      if (!user) {
        throw APIError.internal("Failed to create user");
      }

      return {
        user,
        phone_number: formattedPhone
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to create user");
    }
  }
);

// Updates user phone number
export const updatePhone = api<UpdatePhoneRequest, { success: boolean }>(
  { expose: true, method: "PUT", path: "/auth/phone" },
  async ({ user_id, new_phone_number }) => {
    // Check if user exists
    const user = await authDB.queryRow`
      SELECT id FROM users WHERE id = ${user_id}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    // Format phone number consistently
    const formattedPhone = new_phone_number.trim().startsWith('+') ? new_phone_number.trim() : `+${new_phone_number.trim()}`;

    // Check if phone number already exists
    const existingPhone = await authDB.queryRow`
      SELECT id FROM users WHERE phone_number = ${formattedPhone} AND id != ${user_id}
    `;

    if (existingPhone) {
      throw APIError.alreadyExists("Phone number already exists");
    }

    // Update phone number
    const result = await authDB.queryRow`
      UPDATE users SET phone_number = ${formattedPhone}, updated_at = NOW()
      WHERE id = ${user_id}
      RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("User not found");
    }

    return { success: true };
  }
);

// Gets all users by role
export const getUsersByRole = api<{ role: string }, GetUsersResponse>(
  { expose: true, method: "GET", path: "/auth/users/:role" },
  async ({ role }) => {
    const users = await authDB.queryAll<User>`
      SELECT id, username, role, name, email, phone_number, standard, division, parent_name, created_at, updated_at
      FROM users 
      WHERE role = ${role}
      ORDER BY created_at DESC
    `;

    return { users };
  }
);

// Creates student and parent accounts together
export const createStudentWithParent = api<{
  student_name: string;
  student_username: string;
  student_phone: string;
  standard: string;
  division: string;
  parent_name: string;
  parent_phone: string;
}, { student: User; parent?: User; parent_phone?: string }>(
  { expose: true, method: "POST", path: "/auth/student-with-parent" },
  async ({ student_name, student_username, student_phone, standard, division, parent_name, parent_phone }) => {
    // Check if student username already exists
    const existingStudent = await authDB.queryRow`
      SELECT id FROM users WHERE LOWER(username) = ${student_username.toLowerCase()}
    `;

    if (existingStudent) {
      throw APIError.alreadyExists("Student username already exists");
    }

    // Format phone numbers consistently
    const formattedStudentPhone = student_phone.trim().startsWith('+') ? student_phone.trim() : `+${student_phone.trim()}`;
    const formattedParentPhone = parent_phone.trim().startsWith('+') ? parent_phone.trim() : `+${parent_phone.trim()}`;

    // Check if parent already exists
    const existingParent = await authDB.queryRow<User>`
      SELECT id, username, role, name, email, phone_number, standard, division, parent_name, created_at, updated_at
      FROM users 
      WHERE phone_number = ${formattedParentPhone} AND role = 'parent'
    `;

    // Create student
    const student = await authDB.queryRow<User>`
      INSERT INTO users (username, role, name, phone_number, standard, division, parent_name)
      VALUES (${student_username.toLowerCase()}, 'student', ${student_name}, ${formattedStudentPhone}, ${standard}, ${division}, ${parent_name})
      RETURNING id, username, role, name, email, phone_number, standard, division, parent_name, created_at, updated_at
    `;

    if (!student) {
      throw APIError.internal("Failed to create student");
    }

    let parent = existingParent;
    let parent_phone_number;

    // Create parent if doesn't exist
    if (!existingParent) {
      const parentUsername = parent_name.toLowerCase().replace(/\s+/g, '_');
      parent_phone_number = formattedParentPhone;
      
      parent = await authDB.queryRow<User>`
        INSERT INTO users (username, role, name, phone_number)
        VALUES (${parentUsername}, 'parent', ${parent_name}, ${formattedParentPhone})
        RETURNING id, username, role, name, email, phone_number, standard, division, parent_name, created_at, updated_at
      `;
    }

    // Link parent and child
    if (parent) {
      await authDB.exec`
        INSERT INTO parent_children (parent_id, child_id)
        VALUES (${parent.id}, ${student.id})
      `;
    }

    return {
      student,
      parent: parent || undefined,
      parent_phone: parent_phone_number
    };
  }
);
