export const COMMUNITY_SCHEMA = `
CREATE TABLE IF NOT EXISTS community_entries (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('poll','gallery','project','changelog','achievement')),
 locale varchar(8) NOT NULL, topic text NOT NULL DEFAULT 'all' CHECK(topic IN ('all','minecraft','fortnite')),
 project_key varchar(200) NOT NULL DEFAULT '', title varchar(160) NOT NULL, body text NOT NULL DEFAULT '', payload jsonb NOT NULL DEFAULT '{}',
 published boolean NOT NULL DEFAULT false, moderation text NOT NULL DEFAULT 'draft' CHECK(moderation IN ('draft','pending','approved','rejected')),
 author varchar(64) NOT NULL DEFAULT '', contact_email varchar(254), image_id uuid REFERENCES site_content_images(id) ON DELETE SET NULL,
 discord_receipt text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_public ON community_entries(locale,kind,updated_at DESC) WHERE published AND moderation='approved';
CREATE UNIQUE INDEX IF NOT EXISTS community_project_key ON community_entries(kind,locale,project_key) WHERE kind='project';
CREATE TABLE IF NOT EXISTS community_votes (
 poll_id uuid NOT NULL REFERENCES community_entries(id) ON DELETE CASCADE, visitor_hash char(64) NOT NULL,
 option_index integer NOT NULL CHECK(option_index>=0 AND option_index<8), created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(poll_id,visitor_hash)
);
`;
