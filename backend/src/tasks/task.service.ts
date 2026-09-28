import type { Prisma } from "@prisma/client";
import { AppError } from "../errors/app-error";
import type { TaskRepository } from "./task.repository";
import type {
  CreateTaskInput,
  TaskListInput,
  UpdateTaskInput,
} from "./task.schemas";

const normalize = (
  input: CreateTaskInput | UpdateTaskInput,
): Prisma.TaskUpdateInput => ({
  ...input,
  ...(input.description !== undefined
    ? { description: input.description?.trim() || null }
    : {}),
  ...(input.dueDate !== undefined
    ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
    : {}),
});

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}
  list(userId: string, filters: TaskListInput) {
    return this.repository.findMany(userId, filters);
  }

  async get(userId: string, id: string) {
    const task = await this.repository.findById(userId, id);
    if (!task) throw new AppError(404, "TASK_NOT_FOUND", "Task was not found");
    return task;
  }

  create(userId: string, input: CreateTaskInput) {
    return this.repository.create(userId, normalize(input));
  }

  async update(userId: string, id: string, input: UpdateTaskInput) {
    const task = await this.repository.findById(userId, id);
    if (!task) throw new AppError(404, "TASK_NOT_FOUND", "Task was not found");
    if (task.status === "CANCELLED")
      throw new AppError(400, "TASK_CANCELLED", "Cannot update a cancelled task");
    if (input.status === "CANCELLED" && task.status !== "TODO" && task.status !== "IN_PROGRESS")
      throw new AppError(400, "INVALID_STATUS_TRANSITION", "Only TODO or IN_PROGRESS tasks can be cancelled");
    const updatedTask = await this.repository.update(userId, id, normalize(input));
    if (!updatedTask)
      throw new AppError(404, "TASK_NOT_FOUND", "Task was not found");
    return updatedTask;
  }

 async delete(userId : string, id : string) {
  if(!(await this.repository.delete(userId, id))) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task was not found");
  }
 }
}
