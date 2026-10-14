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
CREATE TABLE IF NOT EXISTS site_account_mfa_attempts (
 user_id uuid NOT NULL, factor_id uuid NOT NULL, code_hash char(64) NOT NULL,
 expires_at timestamptz NOT NULL, PRIMARY KEY(user_id,factor_id,code_hash)
);
CREATE INDEX IF NOT EXISTS site_account_mfa_attempt_expiry ON site_account_mfa_attempts(expires_at);
CREATE TABLE IF NOT EXISTS site_member_modrinth_flows (
 state_hash char(64) PRIMARY KEY, browser_hash char(64) NOT NULL, user_id uuid,
 next_path varchar(512) NOT NULL, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS site_member_modrinth_flow_expiry ON site_member_modrinth_flows(expires_at);
CREATE TABLE IF NOT EXISTS site_member_modrinth_identities (
 user_id uuid UNIQUE NOT NULL REFERENCES site_accounts(id) ON DELETE CASCADE,
 provider_id varchar(128) PRIMARY KEY, name varchar(64) NOT NULL, linked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS username varchar(32);
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS banner text;
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS bio varchar(500) NOT NULL DEFAULT '';
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS banned_until timestamptz;
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS ban_reason varchar(500) NOT NULL DEFAULT '';
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS deletion_due_at timestamptz;
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS auth_delete_pending boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS site_account_deletions_due ON site_accounts(deletion_due_at) WHERE deletion_due_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS site_account_usernames ON site_accounts(lower(username)) WHERE username IS NOT NULL;
CREATE TABLE IF NOT EXISTS site_passkey_flows (
 browser_hash char(64) PRIMARY KEY, challenge_id varchar(128) NOT NULL, purpose varchar(16) NOT NULL, user_id uuid, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS site_profile_images (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES site_accounts(id) ON DELETE CASCADE, bytes bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_account_moderation_log (
 id bigserial PRIMARY KEY, user_id uuid NOT NULL, action varchar(16) NOT NULL, reason varchar(500) NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS gift boolean NOT NULL DEFAULT false;
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS site_order_accounts ON site_orders(user_id,created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS site_request_accounts ON site_requests(user_id,created_at DESC) WHERE user_id IS NOT NULL;
`;
