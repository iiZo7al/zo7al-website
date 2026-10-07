import "server-only";
import { Pool } from "pg";
import { COMMUNITY_SCHEMA } from "./community-schema";
import { ACCOUNT_SCHEMA } from "./account-schema";
import { SITE_SCHEMA } from "./site-schema";
import { initializeCommunity } from "./community-setup";
const globalDB = globalThis as unknown as { sitePool?: Pool; siteSchema?: Promise<unknown> };
export async function siteDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("UNAVAILABLE");
  if (!globalDB.sitePool) {
    globalDB.sitePool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
    globalDB.sitePool.on("error", () => {});
  }
  globalDB.siteSchema ??= globalDB.sitePool.query(SITE_SCHEMA + COMMUNITY_SCHEMA + ACCOUNT_SCHEMA).then(() => initializeCommunity(globalDB.sitePool!)).catch(error => { globalDB.siteSchema = undefined; throw error; });
  await globalDB.siteSchema;
  return globalDB.sitePool;
}
