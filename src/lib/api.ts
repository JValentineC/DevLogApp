// API service functions for DevLogger
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface DevLogEntry {
  id?: number;
  title: string;
  content: string;
  tags: string | null;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  author?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePhoto?: string;
  bio?: string;
  role: "user" | "admin" | "super_admin";
  createdAt?: string;
  updatedAt?: string;
  cycles?: string;
  cycleIds?: string;
}

export interface Person {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  orgEmail?: string;
  personalEmail?: string;
  phone?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  isICaaMember: boolean;
  icaaTier?: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
  cycles?: string;
  cycleIds?: string;
  isCaptain: boolean;
}

export interface Cycle {
  id: number;
  code: string;
  city: string;
  notes?: string;
  memberCount: number;
  captainCount: number;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  entries?: T;
  users?: T;
  people?: T;
  cycles?: T;
  tempPassword?: string;
  error?: string;
  message?: string;
  count?: number;
  details?: Record<string, string | null>;
}

class ApiError extends Error {
  status: number;
  response?: ApiResponse<any>;

  constructor(message: string, status: number, response?: ApiResponse<any>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}

// Get authentication token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

// Generic fetch wrapper with error handling and JWT authentication
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authentication token if available
  const token = getAuthToken();
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const defaultOptions: RequestInit = {
    headers: defaultHeaders,
  };

  // Merge headers properly
  const config: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401 && data.error?.includes("expired")) {
        // Clear invalid token
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");

        throw new ApiError(
          "Your session has expired. Please login again.",
          401,
          data
        );
      }

      throw new ApiError(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors, etc.
    throw new ApiError(
      error instanceof Error ? error.message : "Network error occurred",
      0
    );
  }
}

export const devLogApi = {
  // Create a new dev log entry
  async create(
    entry: Omit<DevLogEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<DevLogEntry> {
    const response = await apiFetch<DevLogEntry>("/devlogs", {
      method: "POST",
      body: JSON.stringify(entry),
    });

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error || "Failed to create dev log",
        500,
        response
      );
    }

    return response.data;
  },

  // Get all dev log entries
  async getAll(filters?: {
    published?: boolean;
    userId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: DevLogEntry[]; count: number }> {
    const params = new URLSearchParams();

    if (filters?.published !== undefined) {
      params.append("published", filters.published.toString());
    }
    if (filters?.userId !== undefined) {
      params.append("userId", filters.userId.toString());
    }
    if (filters?.limit) {
      params.append("limit", filters.limit.toString());
    }
    if (filters?.offset) {
      params.append("offset", filters.offset.toString());
    }

    const endpoint = `/devlogs${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await apiFetch<any>(endpoint);

    if (!response.success || !response.entries) {
      throw new ApiError(
        response.error || "Failed to fetch dev logs",
        500,
        response
      );
    }

    return {
      entries: response.entries,
      count: response.count || 0,
    };
  },

  // Get a specific dev log entry
  async getById(id: number): Promise<DevLogEntry> {
    const response = await apiFetch<DevLogEntry>(`/devlogs/${id}`);

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error || "Failed to fetch dev log",
        404,
        response
      );
    }

    return response.data;
  },

  // Update a dev log entry
  async update(
    id: number,
    entry: Omit<DevLogEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<DevLogEntry> {
    const response = await apiFetch<DevLogEntry>(`/devlogs/${id}`, {
      method: "PUT",
      body: JSON.stringify(entry),
    });

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error || "Failed to update dev log",
        500,
        response
      );
    }

    return response.data;
  },

  // Delete a dev log entry
  async delete(id: number): Promise<void> {
    const response = await apiFetch<void>(`/devlogs/${id}`, {
      method: "DELETE",
    });

    if (!response.success) {
      throw new ApiError(
        response.error || "Failed to delete dev log",
        500,
        response
      );
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiFetch<{ status: string }>("/health");
      return response.success && response.data?.status === "OK";
    } catch {
      return false;
    }
  },
};

// User management API (admin only)
export const userApi = {
  // Get all users (super_admin only)
  async getAll(): Promise<{ users: User[]; count: number }> {
    const response = await apiFetch<any>("/admin/users");

    if (!response.success || !response.users) {
      throw new ApiError(
        response.error || "Failed to fetch users",
        500,
        response
      );
    }

    return {
      users: response.users,
      count: response.count || 0,
    };
  },

  // Create a new user (super_admin only)
  async create(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: "user" | "admin" | "super_admin";
  }): Promise<User> {
    const response = await apiFetch<User>("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error || "Failed to create user",
        500,
        response
      );
    }

    return response.data;
  },

  // Update user role (super_admin only)
  async updateRole(
    userId: number,
    role: "user" | "admin" | "super_admin"
  ): Promise<User> {
    const response = await apiFetch<User>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error || "Failed to update user role",
        500,
        response
      );
    }

    return response.data;
  },

  // Delete a user (super_admin only)
  async delete(userId: number): Promise<void> {
    const response = await apiFetch<void>(`/admin/users/${userId}`, {
      method: "DELETE",
    });

    if (!response.success) {
      throw new ApiError(
        response.error || "Failed to delete user",
        500,
        response
      );
    }
  },

  // Reset user password and remove 2FA (super_admin only)
  async resetPassword(userId: number): Promise<{ tempPassword: string }> {
    const response = await apiFetch<any>(`/admin/reset-password/${userId}`, {
      method: "POST",
    });

    if (!response.success || !response.tempPassword) {
      throw new ApiError(
        response.error || "Failed to reset password",
        500,
        response
      );
    }

    return { tempPassword: response.tempPassword };
  },
};

// Alumni/Person engagement API (admin+ only)
export const peopleApi = {
  // Get all people with filters
  async getAll(filters?: {
    cycleId?: number;
    isCaptain?: boolean;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ people: Person[]; count: number }> {
    const params = new URLSearchParams();

    if (filters?.cycleId) {
      params.append("cycleId", filters.cycleId.toString());
    }
    if (filters?.isCaptain !== undefined) {
      params.append("isCaptain", filters.isCaptain.toString());
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }
    if (filters?.status) {
      params.append("status", filters.status);
    }
    if (filters?.limit) {
      params.append("limit", filters.limit.toString());
    }
    if (filters?.offset) {
      params.append("offset", filters.offset.toString());
    }

    const endpoint = `/people${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await apiFetch<any>(endpoint);

    if (!response.success || !response.people) {
      throw new ApiError(
        response.error || "Failed to fetch people",
        500,
        response
      );
    }

    return {
      people: response.people,
      count: response.count || 0,
    };
  },
};

// Cycle API (admin+ only)
export const cycleApi = {
  // Get all cycles
  async getAll(): Promise<{ cycles: Cycle[]; count: number }> {
    const response = await apiFetch<any>("/cycles");

    if (!response.success || !response.cycles) {
      throw new ApiError(
        response.error || "Failed to fetch cycles",
        500,
        response
      );
    }

    return {
      cycles: response.cycles,
      count: response.count || 0,
    };
  },
};

export { ApiError };
