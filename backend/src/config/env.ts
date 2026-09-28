import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32).optional(),
});

const parsedEnv = envSchema.parse(process.env);
if (parsedEnv.NODE_ENV === "production" && !parsedEnv.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is required in production");
}

export const env = {
  ...parsedEnv,
  AUTH_SECRET: parsedEnv.AUTH_SECRET ?? "taskflow-local-secret-change-in-production",
};
