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
ALTER TABLE community_entries ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS community_account_submissions ON community_entries(user_id,created_at DESC) WHERE user_id IS NOT NULL AND kind='gallery';
CREATE UNIQUE INDEX IF NOT EXISTS community_project_key ON community_entries(kind,locale,project_key) WHERE kind='project';
CREATE TABLE IF NOT EXISTS community_votes (
 poll_id uuid NOT NULL REFERENCES community_entries(id) ON DELETE CASCADE, visitor_hash char(64) NOT NULL,
 option_index integer NOT NULL CHECK(option_index>=0 AND option_index<8), created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(poll_id,visitor_hash)
);
CREATE TABLE IF NOT EXISTS community_installations (
 id text PRIMARY KEY, installed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS community_visitors (
 visitor_hash char(64) PRIMARY KEY, preferences jsonb NOT NULL DEFAULT '{}', seen jsonb NOT NULL DEFAULT '[]',
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(jsonb_typeof(preferences)='object'), CHECK(jsonb_typeof(seen)='array' AND jsonb_array_length(seen)<=200)
);
`;
