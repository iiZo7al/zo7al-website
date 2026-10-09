# Member accounts and store gifts

Member authentication uses Supabase Auth. Existing website data remains in the server-only Neon PostgreSQL connection (`DATABASE_URL`); no browser database access or service-role key is needed. Dashboard administrator authentication and its YouTube/Modrinth integrations remain separate from member accounts.

## Required configuration before merging

This change requires member sign-in for checkout. Do not merge into production until the following setup is complete and the full flow has been verified on the preview deployment.

1. Select or create the owner's Supabase project. Configure these **server-only** Vercel variables: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Keep the existing `DATABASE_URL`. Never put a service-role/secret key or database password in client variables.
2. In Supabase Authentication → URL Configuration, set Site URL to `https://zo7al.is-a.dev` and allow `https://zo7al.is-a.dev/api/account/callback`. Add the exact preview deployment's `/api/account/callback` separately for testing. Use production-only `ZO7AL_SITE_URL=https://zo7al.is-a.dev` for a fixed production origin; omit this variable on previews so their own origin is used.
3. Enable Email, email confirmation, and secure password change. Configure production SMTP and its sender domain, then test confirmation, recovery, and reauthentication delivery.
4. Enable Discord, Google and Azure (Microsoft) with owner-controlled OAuth credentials. Their provider callback is the Supabase project's `/auth/v1/callback`, distinct from the website callback above. Enable manual identity linking to let members connect an additional provider from account settings. Only enabled providers appear on the website.
5. Deploy the preview with these variables. The existing schema initializer adds account tables, link codes, OAuth flows, and optional ownership columns to orders and requests. Existing receipts are retained. Account profile IDs are verified Supabase user IDs, never browser-supplied roles.
6. Build/install bridge **1.2.0** on every backend accepting member link commands: modern Paper 1.21.11 and legacy Bukkit/Spigot 1.8.9 have separate jars. Keep each backend's existing HTTPS bridge endpoint and dashboard-issued key. Install on backend servers, not Velocity. Restart after replacing the old jar.

## Behavior

- Account avatar sits beside the store. Its menu opens settings, linked accounts, password, player profile, and requests. The Minecraft page no longer embeds the account's player profile; public leaderboard profile links remain available.
- Email and OAuth sessions use HttpOnly cookies. Supabase validates server identity; OAuth uses PKCE with a browser-bound, expiring, one-use callback flow. Recovery email links must open in the initiating browser.
- From account settings, enter the exact Minecraft name and generate a ten-minute code. Join a configured backend as that player and run `/zo7allink CODE`. The trusted bridge supplies the actual online player's UUID and name; entering a name on the website alone cannot establish ownership. One player can be linked to one member account.
- Normal checkout requires a linked player and always uses its verified name. Changing the request's recipient field cannot redirect an ordinary purchase.
- Gift mode sends **every item in the cart** to the entered Minecraft name, including a player linked to another member account. The buyer owns the order receipt. Gifts never transfer account ownership. Existing Tebex ownership restrictions still apply to the recipient. One rank per cart, real catalog prices, and quantity restrictions remain enforced.
- Authenticated submissions and orders are associated with the member. Old browser receipts can be claimed only with their existing private receipt token and only when unowned or already owned by that member. IDs alone cannot reveal another member's request.
- Guests can still submit support requests, event registrations, and creator applications and use private tracking codes.
- Common errors open through a support tab with closed accordion items. Fortnite section titles use ordinary news/events/community labels. Account messages and updated profile FAQ destinations cover all ten website locales.

## End-to-end checks before production

1. Complete email signup/confirmation, sign-in, recovery, password reauthentication, and logout. Reload and verify session refresh. Verify enabled Google/Discord/Microsoft login and same-account provider linking; decline or cancel a provider flow and confirm no unexpected identity switch.
2. Attempt a wrong player name, wrong code, expired code, duplicate player, and reused code. Verify only the matching online player can link. Confirm profile/rank/statistics after a bridge sync.
3. Add a rank, ordinary purchase for the linked name, gift to a second linked account, coins quantity, and one-rank restriction. Use Tebex's supported test checkout process; do not create a real charge during verification. Confirm the recipient name before payment.
4. Verify separate accounts cannot list, claim, or track each other's requests by reference alone. Claim a guest receipt with its private token and reload the requests page.
5. Check mobile avatar/cart placement, account tabs, keyboard focus, native dialog opening, common-error accordion, and all ten locales.

Local tests use simulated provider/Tebex responses and PostgreSQL-compatible PGlite. A successful local test run does not confirm production OAuth credentials, SMTP delivery, live payment delivery, or an installed backend plugin. Those checks require the configured preview and servers.

## Microsoft sign-in

Microsoft uses the Supabase `azure` provider. Register a Web application in Microsoft Entra ID with **Accounts in any organizational directory and personal Microsoft accounts**, so members can use personal Microsoft/Xbox accounts as well as work accounts. Register `https://istvaveorgqcgxsdqsch.supabase.co/auth/v1/callback` as its Web redirect URI.

In Supabase Authentication → Sign In / Providers → Azure, set the Application (client) ID, the client secret **Value** (not the Secret ID), and `https://login.microsoftonline.com/common` as the tenant URL. Keep “Allow users without an email” disabled. Add the `email` and `xms_edov` optional claims as described in the current Supabase Azure guide, and record the client secret expiry date. Credentials belong in Supabase, never in repository files or public environment variables.

The website requests the `email` scope for Microsoft sign-in and same-account linking. Both actions retain the existing PKCE flow. Disabled providers are not offered for sign-in, and the API rejects them before creating an OAuth flow. Test personal-account sign-in, cancel, linking, and unlink protection before enabling it in production. Current account menu connections show Microsoft with its four-color icon.

Phone authentication remains disabled and no SMS provider is configured.

## Member two-factor authentication

`/api/account/mfa` uses Supabase Auth's TOTP and experimental recovery-code REST endpoints. TOTP secrets, code validation/replay protection, recovery-code hashes, consumption, rotation and factor ownership remain with Supabase. Neither a service-role key nor an additional Supabase schema is needed. Access and refresh tokens stay in HttpOnly cookies; setup keys and generated backup codes are returned only in private/no-store responses and are not persisted in browser storage.

The current Auth source defaults `GOTRUE_MFA_RECOVERY_CODES_ENROLL_ENABLED` and `GOTRUE_MFA_RECOVERY_CODES_VERIFY_ENABLED` to false. These are Auth-server flags, not website environment variables; hosted-project availability/configuration must be confirmed with Supabase.

Before enabling the settings panel, verify TOTP enrollment/verification and recovery-code enrollment/verification are enabled for this hosted project's Auth version. The current project dashboard confirms TOTP is enabled and AAL1 sessions are limited to 15 minutes; it does not expose recovery-code controls. Recovery-code support is experimental in the current Supabase documentation. Do not assume a successful TOTP setup means backup codes are available.

Only set server-side `ZO7AL_ACCOUNT_MFA_ENABLED=true` after live verification of all four recovery-code endpoints: status (`GET /factors/recovery-codes`), generation (`POST /factors/recovery-codes`), rotation (`POST /factors/recovery-codes/regenerate`) and redemption (`POST /factors/recovery-codes/verify`). `DELETE /factors/recovery-codes` must also be supported for complete disablement. If this feature is unavailable in the project's hosted Auth version/configuration, keep the panel disabled and this PR in draft. Do not weaken authentication or use a service-role bypass to simulate recovery codes.

MFA is enforced independently of the feature flag: a validated `/user` response with verified factors requires the exact remotely validated JWT to have the same user subject and `aal2`. AAL1 sessions cannot view the account or use protected account, receipt, player-link, identity-link or checkout operations. Password, email-recovery and OAuth sessions enter the app/backup challenge. Refreshing a session does not skip MFA. User-editable metadata is never used for assurance decisions.

Account Settings supports QR/manual-key setup, confirmation, one-time backup-code display/copy/download, remaining-code counts, code regeneration and app replacement/removal. Security changes require a new code; generating replacements invalidates the old set. Activation attempts to generate backups in the same fresh verified session, without asking the user to reuse the same TOTP. If backup generation fails after successful TOTP verification, the UI reports that error while preserving the activated factor. The user can retry code generation with a new app code.

Lost-app recovery: sign in using an unused backup code, then add a new app using another unused backup code, verify the new app, and remove the old app with a fresh code from the new one. Removing the final app requires its TOTP code; its recovery-code factor is removed first and refreshed session cookies replace old assurance claims. Removing one of several apps preserves the remaining factors and backups. Unfinished enrollments can be cancelled; a new setup discards only the account's unverified TOTP factors.

Live checks before release: enable with a real member; save backups; sign out and authenticate with password and each enabled OAuth provider; verify AAL1 requests fail before the challenge; redeem a backup once and confirm replay fails; regenerate and confirm old codes fail; replace a lost app; disable the last app and confirm backup revocation; confirm existing native MFA accounts can still challenge when the settings flag is off. Do not enroll or modify an owner's authenticator without their action-time confirmation.

References: [TOTP guide](https://supabase.com/docs/guides/auth/auth-mfa/totp), [recovery-code generation](https://supabase.com/docs/reference/javascript/auth-mfa-recovery-codes-generate), [recovery-code verification](https://supabase.com/docs/reference/javascript/auth-mfa-recovery-codes-verify), [Auth OpenAPI](https://github.com/supabase/auth/blob/master/openapi.yaml).


## Account-owned submissions

New community gallery submissions, creator applications and support reports require a server-validated member session with all enrolled MFA factors satisfied. Their owner is taken only from that session, never from a supplied email, name or user ID. Contact fields remain contact details and do not prove ownership. Forms request sign-in first and prefill account contact/player details where available.

The Requests page includes My submissions alongside orders, creator applications, support and event registrations. Gallery submissions remain privately trackable while pending or rejected; account lists and tracking are scoped to the owner and do not expose contact details, access tokens or private report bodies. Public galleries still show only published approved entries and never disclose member IDs. Existing guest receipts can be claimed using their private code; old gallery entries without a proven owner are not reassigned by matching emails. A Discord notification failure preserves an account-owned support request for later retry.

The schema initializer adds a nullable gallery owner and a partial per-account index without changing existing submissions. Verify two accounts across separate browser sessions, pending/approved/rejected moderation, expired/refresh sessions, MFA challenge enforcement, guest receipt claims and sign-in return paths before release.
