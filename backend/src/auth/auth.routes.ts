import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/require-auth";
import { AuthController } from "./auth.controller";
import { credentialsSchema } from "./auth.schemas";
import type { AuthService } from "./auth.service";

export const createAuthRouter = (service: AuthService) => {
  const router = Router();
  const controller = new AuthController(service);
  router.post("/register", validate(credentialsSchema, "body"), controller.register);
  router.post("/login", validate(credentialsSchema, "body"), controller.login);
  router.post("/logout", controller.logout);
  router.get("/me", requireAuth(service), controller.me);
  return router;
};
