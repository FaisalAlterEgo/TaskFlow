CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Preserve pre-authentication tasks under a disabled migration account.
INSERT INTO "User" ("id", "email", "passwordHash", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'legacy@taskflow.invalid', 'LOGIN_DISABLED', CURRENT_TIMESTAMP);

ALTER TABLE "Task" ADD COLUMN "userId" UUID;
UPDATE "Task" SET "userId" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "Task" ALTER COLUMN "userId" SET NOT NULL;

CREATE INDEX "Task_userId_idx" ON "Task"("userId");
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
