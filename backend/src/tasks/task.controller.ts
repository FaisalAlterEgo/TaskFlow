import type { RequestHandler } from "express";
import type {
  TaskListInput,
  CreateTaskInput,
  UpdateTaskInput,
} from "./task.schemas";
import type { TaskService } from "./task.service";

export class TaskController {
  constructor(private readonly service: TaskService) {}

  list: RequestHandler = async (req, res) => {
    const tasks = await this.service.list(
      req.user!.id,
      req.query as TaskListInput,
    );
    res.json({ data: tasks, meta: { total: tasks.length } });
  };
  get: RequestHandler = async (req, res) => {
    res.json({
      data: await this.service.get(req.user!.id, req.params.id as string),
    });
  };
  create: RequestHandler = async (req, res) => {
    res
      .status(201)
      .json({
        data: await this.service.create(
          req.user!.id,
          req.body as CreateTaskInput,
        ),
      });
  };
  update: RequestHandler = async (req, res) => {
    res.json({
      data: await this.service.update(
        req.user!.id,
        req.params.id as string,
        req.body as UpdateTaskInput,
      ),
    });
  };
  delete: RequestHandler = async (req, res) => {
    await this.service.delete(req.user!.id, req.params.id as string);
    res.status(204).send();
  };
  history: RequestHandler = async (req, res) => {
    res.json({
      data: await this.service.history(
        req.user!.id,
        req.params.id as string,
      ),
    });
  }
}
