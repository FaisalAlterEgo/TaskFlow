import type { RequestHandler } from "express";
import { AUTH_COOKIE } from "../auth/auth.controller";
import type { AuthService } from "../auth/auth.service";
import { AppError } from "../errors/app-error";

export const requireAuth =
  (service: AuthService): RequestHandler =>
  async (req, _res, next) => {
    const token = req.cookies?.[AUTH_COOKIE];
    if (typeof token !== "string") {
      next(new AppError(401, "UNAUTHENTICATED", "Authentication is required"));
      return;
    }
    req.user = await service.authenticate(token);
    next();
  };
