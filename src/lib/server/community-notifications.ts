import "server-only";
import { siteDatabase } from "./site-db";
import { normalizeNotificationState, type NotificationPatch } from "../data/community-notifications";

export async function notificationState(visitorHash: string) {
  const result = await (await siteDatabase()).query("SELECT preferences,seen FROM community_visitors WHERE visitor_hash=$1", [visitorHash]);
  return { state: normalizeNotificationState(result.rows[0]), stored: !!result.rows[0] };
}

export async function saveNotificationState(visitorHash: string, patch: NotificationPatch) {
  const result = await (await siteDatabase()).query(`INSERT INTO community_visitors(visitor_hash,preferences,seen) VALUES($1,$2::jsonb,$3::jsonb)
    ON CONFLICT(visitor_hash) DO UPDATE SET preferences=community_visitors.preferences || excluded.preferences,
    seen=(SELECT coalesce(jsonb_agg(recent.value ORDER BY recent.first_position),'[]'::jsonb) FROM (
      SELECT value,min(position) AS first_position FROM jsonb_array_elements_text(excluded.seen || community_visitors.seen) WITH ORDINALITY AS item(value,position)
      GROUP BY value ORDER BY first_position LIMIT 200
    ) recent),updated_at=now() RETURNING preferences,seen`, [visitorHash, JSON.stringify(patch.preferences ?? {}), JSON.stringify(patch.seen ?? [])]);
  return normalizeNotificationState(result.rows[0]);
}
