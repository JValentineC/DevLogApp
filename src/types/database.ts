// Updated TypeScript types for the new database schema

export interface User {
  id: number;
  // Name fields
  firstName: string;
  middleName?: string;
  lastName: string;

  // Authentication
  email: string; // Must end with @icstars.org
  password: string;
  passwordHint?: string;

  // Profile
  username: string;
  profilePhoto?: string;
  bio?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string; // hex color code
  createdAt: string;
}

export interface DevLog {
  id: number;
  title: string;
  content: string;

  // User relationship
  createdBy: number;
  user?: User; // Populated when needed

  // Images (array of URLs)
  images?: string[]; // Stored as JSON in DB

  // Publishing
  isPublished: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Tags relationship
  tags?: Tag[]; // Populated when needed
}

export interface DevLogTag {
  id: number;
  devLogId: number;
  tagId: number;
}

// API Request/Response types
export interface CreateUserRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string; // Must end with @icstars.org
  password: string;
  passwordHint?: string;
  username: string;
  profilePhoto?: string;
  bio?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  passwordHint?: string;
  username?: string;
  profilePhoto?: string;
  bio?: string;
}

export interface CreateDevLogRequest {
  title: string;
  content: string;
  images?: string[];
  isPublished: boolean;
  tagIds?: number[]; // Array of tag IDs to associate
}

export interface UpdateDevLogRequest {
  title?: string;
  content?: string;
  images?: string[];
  isPublished?: boolean;
  tagIds?: number[]; // Array of tag IDs to associate
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Utility type for full name
export type FullName = {
  firstName: string;
  middleName?: string;
  lastName: string;
};

export function getFullName(user: User): string {
  return user.middleName
    ? `${user.firstName} ${user.middleName} ${user.lastName}`
    : `${user.firstName} ${user.lastName}`;
}

// Email validation
export function isValidIcStarsEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@icstars.org");
}
