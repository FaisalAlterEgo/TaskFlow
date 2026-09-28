import type { CookieOptions, RequestHandler } from "express";
import { env } from "../config/env";
import type { CredentialsInput } from "./auth.schemas";
import type { AuthService } from "./auth.service";

export const AUTH_COOKIE = "taskflow_auth";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};
const clearCookieOptions: CookieOptions = { ...cookieOptions, maxAge: undefined };

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register: RequestHandler = async (req, res) => {
    const user = await this.service.register(req.body as CredentialsInput);
    res.status(201).json({ data: user });
  };

  login: RequestHandler = async (req, res) => {
    const { user, token } = await this.service.login(req.body as CredentialsInput);
    res.cookie(AUTH_COOKIE, token, cookieOptions).json({ data: user });
  };

  logout: RequestHandler = (_req, res) => {
    res.clearCookie(AUTH_COOKIE, clearCookieOptions).status(204).send();
  };

  me: RequestHandler = (req, res) => {
    res.json({ data: req.user });
  };
}
