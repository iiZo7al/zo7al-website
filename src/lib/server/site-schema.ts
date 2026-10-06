export const SITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS site_content (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK (kind IN ('news','event','rule')),
 locale text NOT NULL, title varchar(160) NOT NULL, body text NOT NULL,
 published boolean NOT NULL DEFAULT false, starts_at timestamptz,
 registration_url text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_content_public ON site_content(kind,locale,created_at DESC) WHERE published;
CREATE TABLE IF NOT EXISTS site_content_images (
 id uuid PRIMARY KEY, mime_type text NOT NULL CHECK (mime_type='image/webp'),
 width integer NOT NULL CHECK(width>0), height integer NOT NULL CHECK(height>0),
 bytes bytea NOT NULL CHECK(octet_length(bytes)<=3500000), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS image_id uuid REFERENCES site_content_images(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS site_requests (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK (kind IN ('application','support','event')),
 token_hash char(64) NOT NULL, payload jsonb NOT NULL, status text NOT NULL DEFAULT 'pending',
 public_note varchar(2000) NOT NULL DEFAULT '', discord_receipt text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_requests_recent ON site_requests(created_at DESC);
CREATE TABLE IF NOT EXISTS site_orders (
 id uuid PRIMARY KEY, token_hash char(64) NOT NULL, basket_ident varchar(128) UNIQUE NOT NULL,
 username varchar(32) NOT NULL, items jsonb NOT NULL, discord_receipt text, discord_payload jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS discord_receipt text;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS discord_payload jsonb;
CREATE TABLE IF NOT EXISTS site_rate_limits (
 key char(64) PRIMARY KEY, attempts integer NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS dashboard_connections (
 provider text PRIMARY KEY CHECK (provider IN ('youtube','curseforge','pelican')),
 sealed text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS minecraft_profile_bridges (
 id uuid PRIMARY KEY, name varchar(64) NOT NULL, token_hash char(64) UNIQUE,
 enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), last_sync timestamptz
);
CREATE TABLE IF NOT EXISTS minecraft_player_profiles (
 bridge_id uuid NOT NULL REFERENCES minecraft_profile_bridges(id) ON DELETE CASCADE,
 uuid uuid NOT NULL, username varchar(32) NOT NULL, username_key varchar(32) NOT NULL,
 rank varchar(64), stats jsonb NOT NULL DEFAULT '{}'::jsonb, online boolean NOT NULL,
 last_seen timestamptz, captured_at timestamptz NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(bridge_id,uuid)
);
CREATE INDEX IF NOT EXISTS minecraft_profile_names ON minecraft_player_profiles(username_key,captured_at DESC);
ALTER TABLE minecraft_profile_bridges ADD COLUMN IF NOT EXISTS visible_stats jsonb;
CREATE TABLE IF NOT EXISTS youtube_studio_app (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), sealed text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS youtube_studio_auth (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), sealed text NOT NULL,
 channel_id varchar(24) NOT NULL, title varchar(200) NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS youtube_studio_oauth (
 state_hash char(64) PRIMARY KEY, browser_hash char(64) NOT NULL, sealed text NOT NULL,
 expires_at timestamptz NOT NULL, claimed boolean NOT NULL DEFAULT false
);
`;
