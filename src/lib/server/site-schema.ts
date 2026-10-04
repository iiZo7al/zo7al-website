export const SITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS site_content (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK (kind IN ('news','event','rule')),
 locale text NOT NULL, title varchar(160) NOT NULL, body text NOT NULL,
 published boolean NOT NULL DEFAULT false, starts_at timestamptz,
 registration_url text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_content_public ON site_content(kind,locale,created_at DESC) WHERE published;
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
`;
