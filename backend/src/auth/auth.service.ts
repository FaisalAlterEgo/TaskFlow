import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/app-error";
import type { CredentialsInput } from "./auth.schemas";
import type { UserRepository } from "./user.repository";

export interface PublicUser { id: string; email: string ,name : string}

const publicUser = (user: PublicUser): PublicUser => ({ id: user.id, email: user.email, name : user.name });

export class AuthService {
  constructor(private readonly repository: UserRepository) {}

  async register(input: CredentialsInput) {
    if (await this.repository.findByEmail(input.email)) {
      throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    return publicUser(await this.repository.create(input.email, passwordHash, input.name));
  }

  async login(input: CredentialsInput) {
    const user = await this.repository.findByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }
    return { user: publicUser(user), token: this.signToken(user.id) };
  }

  async authenticate(token: string) {
    try {
      const payload = jwt.verify(token, env.AUTH_SECRET);
      if (typeof payload === "string" || typeof payload.sub !== "string") throw new Error();
      const user = await this.repository.findById(payload.sub);
      if (!user) throw new Error();
      return publicUser(user);
    } catch {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication is required");
    }
  }

  private signToken(userId: string) {
    return jwt.sign({}, env.AUTH_SECRET, { subject: userId, expiresIn: "7d" });
  }
}
