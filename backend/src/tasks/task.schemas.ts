import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

const description = z.string().trim().max(1000, "Description must be 1000 characters or fewer").nullable().optional();
const dueDate = z.string().datetime({ offset: true, message: "Due date must be a valid ISO date" }).nullable().optional();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title must be 120 characters or fewer"),
  description,
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate,
}).strict();

export const updateTaskSchema = createTaskSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided",
);
export const taskIdSchema = z.object({ id: z.string().uuid("Task id must be a valid UUID") });
export const taskListSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  search: z.string().trim().max(120).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListInput = z.infer<typeof taskListSchema>;
