import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { User, OTP } from "./types";

export interface SendOTPRequest {
  phone_number: string;
}

export interface VerifyOTPRequest {
  phone_number: string;
  otp_code: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Send OTP to phone number
export const sendOTP = api<SendOTPRequest, SendOTPResponse>(
  { expose: true, method: "POST", path: "/auth/send-otp" },
  async ({ phone_number }) => {
    // Check if user exists with this phone number
    const user = await authDB.queryRow<User>`
      SELECT id, phone_number FROM users WHERE phone_number = ${phone_number}
    `;

    if (!user) {
      throw APIError.notFound("No user found with this phone number");
    }

    // For demo purposes, we don't actually send OTP
    // Use 123456 as the OTP code
    return {
      success: true,
      message: "Use 123456 as the OTP code (demo mode)"
    };
  }
);

// Verify OTP and authenticate user
export const verifyOTP = api<VerifyOTPRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/verify-otp" },
  async ({ phone_number, otp_code }) => {
    // Check if OTP is exactly 123456 for demo mode
    if (otp_code !== "123456") {
      throw APIError.unauthenticated("Invalid OTP. Use 123456 for demo mode.");
    }

    // Get user
    const user = await authDB.queryRow<User>`
      SELECT id, username, role, name, email, phone_number, standard, division, parent_name, created_at, updated_at
      FROM users 
      WHERE phone_number = ${phone_number}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    // Log the login
    await authDB.exec`
      INSERT INTO login_logs (user_id) VALUES (${user.id})
    `;

    // Generate a simple token (in production, use proper JWT)
    const token = `${user.id}_${Date.now()}`;

    return {
      user,
      token
    };
  }
);

// Clean up expired OTPs (could be called by a cron job)
export const cleanupExpiredOTPs = api<void, { deleted_count: number }>(
  { expose: false, method: "POST", path: "/auth/cleanup-otps" },
  async () => {
    await authDB.exec`
      DELETE FROM otps WHERE expires_at < NOW() OR used = TRUE
    `;

    return { deleted_count: 0 };
  }
);
