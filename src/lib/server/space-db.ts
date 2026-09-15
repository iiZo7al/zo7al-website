import { Pool } from "pg";

const globalDatabase = globalThis as unknown as { spacePool?: Pool };
export function getSpaceDatabase() {
  if (!process.env.DATABASE_URL || !process.env.SPACE_RUN_SECRET) throw new Error("DATABASE_NOT_CONFIGURED");
  globalDatabase.spacePool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 4, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
  return globalDatabase.spacePool;
}
