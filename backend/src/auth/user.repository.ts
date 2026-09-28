import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(email: string, passwordHash: string, name: string): Promise<User>;
}

export class PrismaUserRepository implements UserRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  create(email: string, passwordHash: string, name: string) {
    return prisma.user.create({ data: { email, passwordHash, name } });
  }
}
