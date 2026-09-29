import { createApplicationHandler } from "@/lib/server/creator-applications";
export const runtime = "nodejs";
export const POST = createApplicationHandler(() => process.env.DISCORD_APPLICATION_WEBHOOK_URL);
