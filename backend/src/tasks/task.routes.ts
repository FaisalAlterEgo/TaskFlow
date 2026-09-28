import { Router } from "express";
import { validate } from "../middleware/validate";
import { TaskController } from "./task.controller";
import { PrismaTaskRepository, type TaskRepository } from "./task.repository";
import { createTaskSchema, taskIdSchema, taskListSchema, updateTaskSchema } from "./task.schemas";
import { TaskService } from "./task.service";

export const createTaskRouter = (repository: TaskRepository = new PrismaTaskRepository()) => {
  const router = Router();
  const controller = new TaskController(new TaskService(repository));

  router.get("/", validate(taskListSchema, "query"), controller.list);
  router.post("/", validate(createTaskSchema, "body"), controller.create);
  router.get("/:id", validate(taskIdSchema, "params"), controller.get);
  router.patch("/:id", validate(taskIdSchema, "params"), validate(updateTaskSchema, "body"), controller.update);
  router.delete("/:id", validate(taskIdSchema, "params"), controller.delete);
  return router;
};
