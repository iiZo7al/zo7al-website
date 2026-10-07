import "server-only";
import type { Pool } from "pg";
import { COMMUNITY_STARTER_ENTRIES, FORTNITE_STARTER_POLL } from "../data/community-defaults";

export async function initializeCommunity(db: Pool) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const claim = await client.query("INSERT INTO community_installations(id) VALUES('community-starter-v1') ON CONFLICT DO NOTHING RETURNING id");
    if (claim.rowCount) {
      for (const kind of ["poll", "achievement"]) {
        // An owner's existing configuration, including unpublished goals, takes priority.
        if ((await client.query("SELECT 1 FROM community_entries WHERE kind=$1 LIMIT 1", [kind])).rowCount) continue;
        for (const entry of COMMUNITY_STARTER_ENTRIES.filter(entry => entry.kind === kind)) {
          await client.query("INSERT INTO community_entries(id,kind,locale,topic,title,body,payload,published,moderation) VALUES(gen_random_uuid(),$1,'en',$2,$3,$4,$5::jsonb,true,'approved')", [entry.kind, entry.topic, entry.title, entry.body, JSON.stringify(entry.payload)]);
        }
      }
    }
    const split = await client.query("INSERT INTO community_installations(id) VALUES('community-game-separation-v1') ON CONFLICT DO NOTHING RETURNING id");
    if (split.rowCount) {
      // Retain legacy IDs, votes, moderation and publication choices in Minecraft.
      await client.query("UPDATE community_entries SET topic='minecraft' WHERE kind IN ('poll','gallery') AND topic='all'");
      if (!(await client.query("SELECT 1 FROM community_entries WHERE kind='poll' AND topic='fortnite' LIMIT 1")).rowCount) {
        const entry = FORTNITE_STARTER_POLL;
        await client.query("INSERT INTO community_entries(id,kind,locale,topic,title,body,payload,published,moderation) VALUES(gen_random_uuid(),$1,'en',$2,$3,$4,$5::jsonb,true,'approved')", [entry.kind, entry.topic, entry.title, entry.body, JSON.stringify(entry.payload)]);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
