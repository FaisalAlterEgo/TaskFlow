import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { it } from "node:test";
import type { PrismaClient } from "@prisma/client";
import { PrismaTaskRepository } from "./task.repository";

it("passes the task id and action to the matching Prisma History fields", async () => {
  const userId = randomUUID();
  const taskId = randomUUID();
  const action = "Status changed from TODO to IN_PROGRESS";
  let calls = 0;
  const historyModel = { create: async (args: {
    data: { userId: string; taskId: string; action: string };
  }) => {
    calls++;
    assert.deepEqual(args.data, { userId, taskId, action });
    return { id: randomUUID(), ...args.data, createdAt: new Date() };
  } } as unknown as PrismaClient["history"];

  const history = await new PrismaTaskRepository(historyModel).createHistory(userId, taskId, action);
  assert.equal(history.taskId, taskId);
  assert.equal(history.action, action);
  assert.equal(calls, 1);
});
