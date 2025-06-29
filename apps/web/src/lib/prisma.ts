// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "test" ? [] : ["query"], // Disable logging in tests
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
