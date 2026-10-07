import type { Prisma, PrismaClient, Task } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { TaskListInput } from "./task.schemas";

export interface TaskRepository {
  findMany(userId: string, filters: TaskListInput): Promise<Task[]>;
  findById(userId: string, id: string): Promise<Task | null>;
  findHistory(
    userId: string,
    id: string,
  ): Promise<Prisma.HistoryGetPayload<{}>[]>;
  create(userId: string, data: Prisma.TaskUpdateInput): Promise<Task>;
  createHistory(
    userId: string,
    taskId: string,
    action: string,
  ): Promise<Prisma.HistoryGetPayload<{}>>;
  update(
    userId: string,
    id: string,
    data: Prisma.TaskUpdateInput,
  ): Promise<Task | null>;
  delete(userId: string, id: string): Promise<boolean>;
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(
    private readonly historyModel: PrismaClient["history"] = prisma.history,
  ) {}

  findMany(userId: string, filters: TaskListInput) {
    return prisma.task.findMany({
      where: {
        userId,
        status: filters.status,
        priority: filters.priority,
        ...(filters.search
          ? {
              OR: [
                {
                  title: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  description: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
  }

  findById(userId: string, id: string) {
    return prisma.task.findFirst({ where: { id, userId } });
  }
  async create(userId: string, data: Prisma.TaskUpdateInput) {
    const task = await prisma.task.create({
      data: { ...data, userId } as Prisma.TaskUncheckedCreateInput,
    });
    return task;
  }
  findHistory(userId: string, id: string) {
    return this.historyModel.findMany({
      where: { userId, taskId: id },
    });
  }
  createHistory(userId: string, taskId: string, action: string) {
    return this.historyModel.create({
      data: { userId, taskId, action },
    });
  }

  async update(userId: string, id: string, data: Prisma.TaskUpdateInput) {
    const result = await prisma.task.updateMany({
      where: { id, userId },
      data,
    });
    return result.count ? this.findById(userId, id) : null;
  }

  async delete(userID: string, id: string) {
    const result = await prisma.task.deleteMany({
      where: { id, userId: userID },
    });
    return result.count > 0;
  }
}
