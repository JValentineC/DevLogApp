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
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  entries?: T;
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

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
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
    limit?: number;
    offset?: number;
  }): Promise<{ entries: DevLogEntry[]; count: number }> {
    const params = new URLSearchParams();

    if (filters?.published !== undefined) {
      params.append("published", filters.published.toString());
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

export { ApiError };
