import process from "node:process";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

process.loadEnvFile?.();

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db"
});

const prismaClient = globalThis.__dailyAiInsightPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.__dailyAiInsightPrisma = prismaClient;
}

export const prisma = prismaClient;
