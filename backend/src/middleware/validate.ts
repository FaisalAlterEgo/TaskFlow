import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "params" | "query";

export const validate = (schema: ZodType, part: RequestPart): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.parse(req[part]);
    Object.defineProperty(req, part, { value: parsed, writable: true });
    next();
  };
