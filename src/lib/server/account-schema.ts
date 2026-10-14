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
ALTER TABLE site_accounts ADD COLUMN IF NOT EXISTS auth_purged_at timestamptz;
CREATE TABLE IF NOT EXISTS site_account_recovery_codes(user_id uuid NOT NULL REFERENCES site_accounts(id) ON DELETE CASCADE,code_hash char(64) NOT NULL,used_at timestamptz,PRIMARY KEY(user_id,code_hash));
CREATE TABLE IF NOT EXISTS site_account_second_factors(token_hash char(64) PRIMARY KEY,user_id uuid NOT NULL,session_id uuid NOT NULL,factor_hash char(64) NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS site_account_action_proofs(token_hash char(64) PRIMARY KEY,user_id uuid NOT NULL,session_id uuid NOT NULL,purpose varchar(32) NOT NULL,target varchar(160) NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS site_account_email_challenges(browser_hash char(64) PRIMARY KEY,user_id uuid NOT NULL,session_id uuid NOT NULL,email varchar(254) NOT NULL,attempts integer NOT NULL DEFAULT 0,purpose varchar(32) NOT NULL,target varchar(160) NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS site_account_saved_sessions(device_hash char(64) NOT NULL,user_id uuid NOT NULL REFERENCES site_accounts(id) ON DELETE CASCADE,sealed text NOT NULL,expires_at timestamptz NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(device_hash,user_id));
CREATE INDEX IF NOT EXISTS site_account_saved_session_expiry ON site_account_saved_sessions(expires_at);
CREATE INDEX IF NOT EXISTS site_account_deletions_due ON site_accounts(deletion_due_at) WHERE deletion_due_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS site_account_usernames ON site_accounts(lower(username)) WHERE username IS NOT NULL;
CREATE TABLE IF NOT EXISTS site_passkey_flows (
 browser_hash char(64) PRIMARY KEY, challenge_id varchar(128) NOT NULL, purpose varchar(16) NOT NULL, user_id uuid, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS site_profile_images (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES site_accounts(id) ON DELETE CASCADE, bytes bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_badges(id uuid PRIMARY KEY,name varchar(64) NOT NULL,image_id uuid NOT NULL REFERENCES site_content_images(id),archived boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS site_member_badges(user_id uuid NOT NULL REFERENCES site_accounts(id) ON DELETE CASCADE,badge_id uuid NOT NULL REFERENCES site_badges(id) ON DELETE CASCADE,awarded_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,badge_id));
CREATE TABLE IF NOT EXISTS site_account_moderation_log (
 id bigserial PRIMARY KEY, user_id uuid NOT NULL, action varchar(16) NOT NULL, reason varchar(500) NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS gift boolean NOT NULL DEFAULT false;
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS site_order_accounts ON site_orders(user_id,created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS site_request_accounts ON site_requests(user_id,created_at DESC) WHERE user_id IS NOT NULL;
`;
