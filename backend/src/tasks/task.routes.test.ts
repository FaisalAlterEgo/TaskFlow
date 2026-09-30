import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, it } from "node:test";
import type { Prisma, Task, User } from "@prisma/client";
import request from "supertest";
import { createApp } from "../app";
import type { UserRepository } from "../auth/user.repository";
import type { TaskRepository } from "./task.repository";
import type { TaskListInput } from "./task.schemas";

class MemoryTaskRepository implements TaskRepository {
  tasks: Task[] = [];

  async findMany(userId: string, filters: TaskListInput) {
    return this.tasks.filter(
      (task) =>
        task.userId === userId &&
        (!filters.status || task.status === filters.status) &&
        (!filters.priority || task.priority === filters.priority) &&
        (!filters.search ||
          `${task.title} ${task.description ?? ""}`
            .toLowerCase()
            .includes(filters.search.toLowerCase())),
    );
  }

  async findById(userId: string, id: string) {
    return (
      this.tasks.find((task) => task.id === id && task.userId === userId) ??
      null
    );
  }

  async create(userId: string, data: Prisma.TaskUpdateInput) {
    const now = new Date();
    const task: Task = {
      id: randomUUID(),
      userId,
      title: data.title as string,
      description: (data.description as string | null) ?? null,
      status: (data.status as Task["status"]) ?? "TODO",
      priority: (data.priority as Task["priority"]) ?? "MEDIUM",
      dueDate: (data.dueDate as Date | null) ?? null,
      createdAt: now,
      updatedAt: now,
      completionDesk: (data.completionDesk as string | null) ?? null,
    };
    this.tasks.push(task);
    return task;
  }

  async update(userId: string, id: string, data: Prisma.TaskUpdateInput) {
    const index = this.tasks.findIndex(
      (task) => task.id === id && task.userId === userId,
    );
    if (index < 0) return null;
    this.tasks[index] = {
      ...this.tasks[index],
      ...(data as Partial<Task>),
      updatedAt: new Date(),
    };
    return this.tasks[index];
  }

  async delete(userId: string, id: string) {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter(
      (task) => task.id !== id || task.userId !== userId,
    );
    return before !== this.tasks.length;
  }
}

class MemoryUserRepository implements UserRepository {
  users: User[] = [];
  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }
  async findById(id: string) {
    return this.users.find((user) => user.id === id) ?? null;
  }
  async create(email: string, passwordHash: string, name: string) {
    const now = new Date();
    const user = {
      id: randomUUID(),
      email,
      passwordHash,
      name,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return user;
  }
}

async function authenticatedAgent(
  app: ReturnType<typeof createApp>,
  email = "user@example.com",
) {
  const agent = request.agent(app);
  await agent
    .post("/api/auth/register")
    .send({ email, password: "password123", name: "John Doe" })
    .expect(201);
  await agent
    .post("/api/auth/login")
    .send({ email, password: "password123" })
    .expect(200);
  return agent;
}

describe("task API", () => {
  let repository: MemoryTaskRepository;
  let userRepository: MemoryUserRepository;
  beforeEach(() => {
    repository = new MemoryTaskRepository();
    userRepository = new MemoryUserRepository();
  });

  it("creates, updates, lists, and deletes a task", async () => {
    const app = createApp(repository, userRepository);
    const agent = await authenticatedAgent(app);
    const created = await agent
      .post("/api/tasks")
      .send({ title: "Ship release", priority: "HIGH" })
      .expect(201);
    assert.equal(created.body.data.title, "Ship release");

    await agent
      .patch(`/api/tasks/${created.body.data.id}`)
      .send({ status: "DONE" })
      .expect(200)
      .expect((response) => assert.equal(response.body.data.status, "DONE"));
    await agent
      .get("/api/tasks?status=DONE")
      .expect(200)
      .expect((response) => assert.equal(response.body.meta.total, 1));
    await agent.delete(`/api/tasks/${created.body.data.id}`).expect(204);
    await agent.get(`/api/tasks/${created.body.data.id}`).expect(404);
  });

  it("returns structured validation errors", async () => {
    const agent = await authenticatedAgent(
      createApp(repository, userRepository),
    );
    await agent
      .post("/api/tasks")
      .send({ title: "" })
      .expect(400)
      .expect((response) =>
        assert.equal(response.body.error.code, "VALIDATION_ERROR"),
      );
  });

  it("cancels TODO and IN_PROGRESS tasks, then prevents further updates but allows deletion", async () => {
    const app = createApp(repository, userRepository);
    const agent = await authenticatedAgent(app);
    const todo = await agent
      .post("/api/tasks")
      .send({ title: "Cancel TODO" })
      .expect(201);
    const inProgress = await agent
      .post("/api/tasks")
      .send({ title: "Cancel in progress", status: "IN_PROGRESS" })
      .expect(201);

    for (const task of [todo.body.data, inProgress.body.data]) {
      await agent
        .patch(`/api/tasks/${task.id}`)
        .send({ status: "CANCELLED" })
        .expect(200)
        .expect((response) =>
          assert.equal(response.body.data.status, "CANCELLED"),
        );
      await agent
        .patch(`/api/tasks/${task.id}`)
        .send({ title: "Must not change" })
        .expect(400)
        .expect((response) =>
          assert.equal(response.body.error.code, "TASK_CANCELLED"),
        );
      await agent.delete(`/api/tasks/${task.id}`).expect(204);
    }
  });

  it("does not allow a DONE task to be cancelled", async () => {
    const app = createApp(repository, userRepository);
    const agent = await authenticatedAgent(app);
    const done = await agent
      .post("/api/tasks")
      .send({ title: "Already done", status: "DONE" })
      .expect(201);

    await agent
      .patch(`/api/tasks/${done.body.data.id}`)
      .send({ status: "CANCELLED" })
      .expect(400)
      .expect((response) =>
        assert.equal(response.body.error.code, "INVALID_STATUS_TRANSITION"),
      );
  });

  it("requires login and keeps the password hashed", async () => {
    const app = createApp(repository, userRepository);
    await request(app).get("/api/tasks").expect(401);

    const agent = await authenticatedAgent(app);
    assert.notEqual(userRepository.users[0].passwordHash, "password123");
    assert.match(userRepository.users[0].passwordHash, /^\$2/);
    await agent
      .get("/api/auth/me")
      .expect(200)
      .expect((response) =>
        assert.equal(response.body.data.email, "user@example.com"),
      );
    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/tasks").expect(401);
  });

  it("prevents user A from reading or modifying user B's task", async () => {
    const app = createApp(repository, userRepository);
    const userA = await authenticatedAgent(app, "a@example.com");
    const userB = await authenticatedAgent(app, "b@example.com");
    const taskB = await userB
      .post("/api/tasks")
      .send({ title: "B private task" })
      .expect(201);
    const id = taskB.body.data.id as string;

    await userA
      .get("/api/tasks")
      .expect(200)
      .expect((response) => assert.equal(response.body.meta.total, 0));
    await userA.get(`/api/tasks/${id}`).expect(404);
    await userA
      .patch(`/api/tasks/${id}`)
      .send({ title: "Hijacked" })
      .expect(404);
    await userA.delete(`/api/tasks/${id}`).expect(404);
    await userB
      .get(`/api/tasks/${id}`)
      .expect(200)
      .expect((response) =>
        assert.equal(response.body.data.title, "B private task"),
      );
  });
});
