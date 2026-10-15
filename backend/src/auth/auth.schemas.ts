import { z } from "zod";

export const credentialsSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Email must be valid")
      .max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72),
  })
  .strict();

export type CredentialsInput = z.infer<typeof credentialsSchema>;
