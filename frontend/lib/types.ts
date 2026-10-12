export const taskStatuses = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completionDesk: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  completionDesk?: string;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus | "ALL";
  priority?: TaskPriority | "ALL";
}

export interface User {
  name : string;
  id: string;
  email: string;
}

export interface Credentials {
  name: string;
  email: string;
  password: string;
}

export interface History {
  id: string;
  userId: string;
  action: string;
  createdAt: string;
}

