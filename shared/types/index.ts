/**
 * Shared types used by both frontend and backend.
 * These will grow as we build out features.
 */

/** Basic user profile, matches the Convex users table. */
export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: number;
}

/** Appointment status values. */
export type AppointmentStatus = "confirmed" | "pending" | "cancelled";

/** Placeholder — will be expanded when we build the booking flow. */
export interface Appointment {
  _id: string;
  title: string;
  provider: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}
