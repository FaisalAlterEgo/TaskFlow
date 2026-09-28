import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import type { TaskRepository } from "./tasks/task.repository";
import { createTaskRouter } from "./tasks/task.routes";
import { createAuthRouter } from "./auth/auth.routes";
import { PrismaUserRepository, type UserRepository } from "./auth/user.repository";
import { AuthService } from "./auth/auth.service";
import { requireAuth } from "./middleware/require-auth";

export const createApp = (
  taskRepository?: TaskRepository,
  userRepository: UserRepository = new PrismaUserRepository(),
) => {
  const app = express();
  const authService = new AuthService(userRepository);
  app.disable("x-powered-by");
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
  app.use("/api/auth", createAuthRouter(authService));
  app.use("/api/tasks", requireAuth(authService), createTaskRouter(taskRepository));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
