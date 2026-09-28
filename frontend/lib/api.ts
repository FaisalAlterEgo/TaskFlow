import type { Credentials, Task, TaskFilters, TaskInput, User } from "./types";

interface ErrorResponse { error?: { message?: string } }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as ErrorResponse;
    throw new Error(payload.error?.message ?? `Request failed with status ${response.status}`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const taskApi = {
  async list(filters: TaskFilters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
    if (filters.priority && filters.priority !== "ALL") params.set("priority", filters.priority);
    const query = params.size ? `?${params.toString()}` : "";
    return request<{ data: Task[]; meta: { total: number } }>(`/api/tasks${query}`);
  },
  create(input: TaskInput) {
    return request<{ data: Task }>("/api/tasks", { method: "POST", body: JSON.stringify(input) });
  },
  update(id: string, input: Partial<TaskInput>) {
    return request<{ data: Task }>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },
  delete(id: string) { return request<void>(`/api/tasks/${id}`, { method: "DELETE" }); },
};

export const authApi = {
  register(credentials: Credentials) {
    return request<{ data: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  login(credentials: Credentials) {
    return request<{ data: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  me() { return request<{ data: User }>("/api/auth/me"); },
  logout() { return request<void>("/api/auth/logout", { method: "POST" }); },
};
