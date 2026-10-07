export const ACCOUNT_SCHEMA = `
CREATE TABLE IF NOT EXISTS site_accounts (
 id uuid PRIMARY KEY, name varchar(64) NOT NULL DEFAULT '', locale varchar(8) NOT NULL DEFAULT 'en',
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_minecraft_links (
 user_id uuid PRIMARY KEY REFERENCES site_accounts(id) ON DELETE CASCADE,
 uuid uuid UNIQUE NOT NULL, username varchar(32) NOT NULL, username_key varchar(32) UNIQUE NOT NULL,
 linked_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_minecraft_link_codes (
 user_id uuid PRIMARY KEY REFERENCES site_accounts(id) ON DELETE CASCADE,
 code_hash char(64) UNIQUE NOT NULL, username_key varchar(32) NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS site_account_auth_flows (
 browser_hash char(64) PRIMARY KEY, verifier varchar(128) NOT NULL,
 purpose varchar(16) NOT NULL, user_id uuid, next_path varchar(512) NOT NULL, expires_at timestamptz NOT NULL
);
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS gift boolean NOT NULL DEFAULT false;
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS site_order_accounts ON site_orders(user_id,created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS site_request_accounts ON site_requests(user_id,created_at DESC) WHERE user_id IS NOT NULL;
`;
