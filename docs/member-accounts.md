# Member accounts and store gifts

Member authentication uses Supabase Auth. Existing website data remains in the server-only Neon PostgreSQL connection (`DATABASE_URL`); no browser database access or service-role key is needed. Dashboard administrator authentication and its YouTube/Modrinth integrations remain separate from member accounts.

## Required configuration before merging

This change requires member sign-in for checkout. Do not merge into production until the following setup is complete and the full flow has been verified on the preview deployment.

1. Select or create the owner's Supabase project. Configure these **server-only** Vercel variables: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Keep the existing `DATABASE_URL`. Never put a service-role/secret key or database password in client variables.
2. In Supabase Authentication → URL Configuration, set Site URL to `https://zo7al.is-a.dev` and allow `https://zo7al.is-a.dev/api/account/callback`. Add the exact preview deployment's `/api/account/callback` separately for testing. Use production-only `ZO7AL_SITE_URL=https://zo7al.is-a.dev` for a fixed production origin; omit this variable on previews so their own origin is used.
3. Enable Email, email confirmation, and secure password change. Configure production SMTP and its sender domain, then test confirmation, recovery, and reauthentication delivery.
4. Enable Discord, Google and Azure (Microsoft) with owner-controlled OAuth credentials. Their provider callback is the Supabase project's `/auth/v1/callback`, distinct from the website callback above. Enable manual identity linking to let members connect an additional provider from account settings. Only enabled providers appear on the website.
5. Deploy the preview with these variables. The existing schema initializer adds account tables, link codes, OAuth flows, and optional ownership columns to orders and requests. Existing receipts are retained. Account profile IDs are verified Supabase user IDs, never browser-supplied roles.
6. Build/install bridge **1.3.0** on every backend accepting member link commands: modern Paper 1.21.11 and legacy Bukkit/Spigot 1.8.9 have separate jars. Keep each backend's existing HTTPS bridge endpoint and dashboard-issued key. Install on backend servers, not Velocity. Restart after replacing the old jar.

## Behavior

- Account avatar sits beside the store. Its menu opens settings, linked accounts, password, player profile, and requests. The Minecraft page no longer embeds the account's player profile; public leaderboard profile links remain available.
- Email and OAuth sessions use HttpOnly cookies. Supabase validates server identity; OAuth uses PKCE with a browser-bound, expiring, one-use callback flow. Recovery email links must open in the initiating browser.
- From account settings, enter the exact Minecraft name and generate a ten-minute code. Join a configured backend as that player and run `/zo7allink CODE`. The trusted bridge supplies the actual online player's UUID and name; entering a name on the website alone cannot establish ownership. One player can be linked to one member account.
- Normal checkout requires a linked player and always uses its verified name. Changing the request's recipient field cannot redirect an ordinary purchase.
- Gift mode sends **every item in the cart** to the entered Minecraft name, including a player linked to another member account. The buyer owns the order receipt. Gifts never transfer account ownership. Existing Tebex ownership restrictions still apply to the recipient. One rank per cart, real catalog prices, and quantity restrictions remain enforced.
- Authenticated submissions and orders are associated with the member. Old browser receipts can be claimed only with their existing private receipt token and only when unowned or already owned by that member. IDs alone cannot reveal another member's request.
- Creator applications, gallery submissions and support reports require sign-in. Event registrations retain their existing guest flow.
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

TOTP setup is available independently of the experimental recovery-code feature. Supabase remains authoritative for enrollment and verification. If the native recovery-code endpoint reports the feature disabled/not found, the status response distinguishes unavailable backups from unenrolled backups; TOTP setup, challenge and removal continue to work. Invalid responses and upstream outages still surface as errors. The former website `ZO7AL_ACCOUNT_MFA_ENABLED` gate is no longer required.

Live verification is still required for all backup endpoints before promising recovery-code support: status, generation, regeneration, redemption and deletion. No service-role or local assurance bypass is used. If backup generation fails after TOTP confirmation, the factor remains active and the UI reports the unavailable backup service.
MFA is enforced independently of the feature flag: a validated `/user` response with verified factors requires the exact remotely validated JWT to have the same user subject and `aal2`. AAL1 sessions cannot view the account or use protected account, receipt, player-link, identity-link or checkout operations. Password, email-recovery and OAuth sessions enter the app/backup challenge. Refreshing a session does not skip MFA. User-editable metadata is never used for assurance decisions.

Account Settings supports QR/manual-key setup, confirmation, one-time backup-code display/copy/download, remaining-code counts, code regeneration and app replacement/removal. Security changes require a new code; generating replacements invalidates the old set. Activation attempts to generate backups in the same fresh verified session, without asking the user to reuse the same TOTP. If backup generation fails after successful TOTP verification, the UI reports that error while preserving the activated factor. The user can retry code generation with a new app code.

Lost-app recovery: sign in using an unused backup code, then add a new app using another unused backup code, verify the new app, and remove the old app with a fresh code from the new one. Removing the final app requires its TOTP code; its recovery-code factor is removed first and refreshed session cookies replace old assurance claims. Removing one of several apps preserves the remaining factors and backups. Unfinished enrollments can be cancelled; a new setup discards only the account's unverified TOTP factors.

Live checks before release: enable with a real member; save backups; sign out and authenticate with password and each enabled OAuth provider; verify AAL1 requests fail before the challenge; redeem a backup once and confirm replay fails; regenerate and confirm old codes fail; replace a lost app; disable the last app and confirm backup revocation; confirm existing native MFA accounts can still challenge when the settings flag is off. Do not enroll or modify an owner's authenticator without their action-time confirmation.

References: [TOTP guide](https://supabase.com/docs/guides/auth/auth-mfa/totp), [recovery-code generation](https://supabase.com/docs/reference/javascript/auth-mfa-recovery-codes-generate), [recovery-code verification](https://supabase.com/docs/reference/javascript/auth-mfa-recovery-codes-verify), [Auth OpenAPI](https://github.com/supabase/auth/blob/master/openapi.yaml).


## Account-owned submissions

New community gallery submissions, creator applications and support reports require a server-validated member session with all enrolled MFA factors satisfied. Their owner is taken only from that session, never from a supplied email, name or user ID. Contact fields remain contact details and do not prove ownership. Forms request sign-in first and prefill account contact/player details where available.

The Requests page includes My submissions alongside orders, creator applications, support and event registrations. Gallery submissions remain privately trackable while pending or rejected; account lists and tracking are scoped to the owner and do not expose contact details, access tokens or private report bodies. Public galleries still show only published approved entries and never disclose member IDs. Existing guest receipts can be claimed using their private code; old gallery entries without a proven owner are not reassigned by matching emails. A Discord notification failure preserves an account-owned support request for later retry.

The schema initializer adds a nullable gallery owner and a partial per-account index without changing existing submissions. Verify two accounts across separate browser sessions, pending/approved/rejected moderation, expired/refresh sessions, MFA challenge enforcement, guest receipt claims and sign-in return paths before release.

## Public member profiles and moderation

Members can choose a unique, case-insensitive username (3–32 letters, digits or underscores), then publish `/@username` with an avatar, banner, biography and HTTPS social links. Account settings support image uploads as well as image URLs. Uploaded images are size-limited, decoded and converted to WebP; unpublished uploads are visible only to their owner. Public profiles show only approved, published gallery submissions, without email addresses, account IDs, request bodies or receipt tokens.

The requests workspace now requires sign-in for every tab and loads account-owned records directly. It does not read device receipts or display a reference/code lookup form. Legacy claim APIs remain available for a deliberate migration of older receipts. New gallery submissions and creator applications take the contact email and author from the verified account. Creator applications require linked Discord and a Minecraft account verified through the server bridge; the form offers identity linking instead of editable Discord/email fields.

Dashboard → Profiles provides search, permanent bans, timed bans, unbanning and profile deletion. Every action requires the existing administrator session and a same-origin request, is recorded in a moderation log, and runs in a transaction. Bans and deletion are checked against the site database on protected account operations, including existing sessions and MFA/passkey enrollment. Timed bans expire automatically. Profile deletion removes its public identity, uploaded media and Minecraft link, hides its submissions and keeps a minimal revocation tombstone plus order/support history. Deletion now also permanently removes the upstream Auth account, revokes provider identities and anonymizes purchase records. A minimal revocation tombstone prevents stale sessions from reviving a deleted account.

## Passkeys (face/fingerprint/security key)

The website uses Supabase's native two-step WebAuthn endpoints with HttpOnly session cookies. Registration/list/deletion require the verified account with enrolled MFA satisfied. Authentication options are bound to a five-minute, one-use HttpOnly browser flow; the provider validates the signed credential. A passkey sign-in still enters the existing MFA challenge whenever the returned verified session is AAL1 for a user with verified factors. No session tokens or private keys are returned to client JavaScript or saved in localStorage.

Enable Authentication → Passkeys in the same Supabase project:

- RP display name: `Zo7al Projects`
- RP ID: `zo7al.is-a.dev`
- RP origin: `https://zo7al.is-a.dev`

Use a separate localhost configuration/project for local testing; unrelated Vercel preview domains cannot register a passkey bound to `zo7al.is-a.dev`. Keep the production RP ID stable. Verify registration, sign-in, cancellation, credential deletion, missing/replayed challenges and an account with TOTP/backup codes before release. Face/fingerprint prompts depend on the member's device and authenticator; the website never receives biometric data. Supabase passkeys are currently experimental. Documentation: https://supabase.com/docs/guides/auth/passkeys. REST shapes checked against `@supabase/auth-js` 2.117.3.

The website reads Supabase `/settings.passkeys_enabled` for both its UI and API. It no longer requires a second website passkey flag. A disabled upstream feature stays unavailable, and existing MFA requirements are enforced independently.

## Minecraft ban synchronization

Install bridge **1.3.0** on both modern Paper and legacy backends. Each captured player profile now includes vanilla account-ban state, reason and expiry from the backend's Bukkit/Paper ban list. Account Settings → Minecraft bans reads only the authenticated member's verified Minecraft UUID across enabled bridges. These details remain private; public player profiles never expose ban reasons.

Old 1.2.0 jars do not report bans and display “no information” rather than “not banned.” Stale/offline servers display the last synchronization warning. Expired bans are no longer shown as active. Ban systems that maintain their own separate storage (for example a proxy-wide punishment plugin) need an adapter before their punishments can be reported; do not infer bans from kicks or failed connections.

## Validation for this change

Local verification covers the site build, TypeScript, ESLint, account ownership/MFA and passkey replay tests, profile uniqueness and ban/deletion authorization, and modern/legacy Java bridge compilation and tests. Live provider enrollment/recovery and deployment configuration still need the authorized project session. No owner authenticator was changed during development.

## Modrinth member sign-in

Modrinth OAuth uses `https://zo7al.is-a.dev/auth/callback` directly. A separate member application requests only `USER_READ USER_READ_EMAIL`. Set the private Production variables `MODRINTH_MEMBER_CLIENT_ID`, `MODRINTH_MEMBER_CLIENT_SECRET`, `SUPABASE_SECRET_KEY`, and `ZO7AL_ACCOUNT_MODRINTH_ENABLED=true`. No Supabase custom Modrinth provider is required.

A ten-minute, single-use database state is bound to an HttpOnly browser cookie. The backend validates the real Modrinth token and immutable user ID. Linking requires the existing fully authenticated account both before and after the redirect. Identities cannot move between accounts and emails never auto-merge them.

The server-only Auth management bridge creates a native AAL1 session for the mapped account; verified native factors still require AAL2. New Modrinth-only members receive a random private synthetic login address, never a falsely verified personal email. This identifier is hidden from the account interface. Modrinth access tokens are discarded after identity verification. All account protection, passkeys and MFA remain within the existing native session system.

## Owner access and account deletion

`ZO7AL_ADMIN_ACCOUNT_IDS` contains immutable Auth UUIDs, not emails or editable metadata. Every dashboard API authorizes the remotely validated member session, checks bans/deletion and enforces enrolled MFA. The existing password fallback remains available. Dashboard sign-out clears member and administrator cookies.

Administrator deletion immediately revokes the website account, removes its profile, links, requests and submissions, anonymizes purchase records, and permanently deletes the upstream Auth user including its provider identities. A minimal ID-only tombstone prevents stale sessions from reviving it. Failures remain revoked and are retried by the deletion queue. Owner accounts cannot be deleted.

Members can request deletion after confirmation in Account Settings. The account signs out, its public profile becomes hidden, and a 15-day grace period starts. A fresh sign-in cancels the request only after enrolled MFA is satisfied and before the deadline. Expired requests fail closed. A private Vercel daily cron, authenticated by `CRON_SECRET`, completes permanent deletion and retries failed upstream cleanup.

## Google consent branding and Discord conflicts

In Google Cloud → Google Auth Platform → Branding, set the OAuth **App name** to `Zo7al Projects`. Repository metadata cannot change the Google consent app name. Google's branding review/verification can affect when the name replaces the Supabase domain on the consent screen.

Discord's observed callback failure was `Identity is already linked to another user`. The website explains this conflict and offers an explicit sign-in to the account already linked to Discord. It never moves a provider identity or merges accounts merely because an email matches. To move the identity, first authenticate the existing account, ensure another usable sign-in method, then unlink Discord there and link it from the intended account.

## Optional polls in news

Dashboard → News creates a news post with an optional poll question, 2–8 unique options and an optional expiry. News and poll publication update atomically; editing a news post preserves its poll ID and votes. Once votes exist, changing options is rejected without changing the news. Removing a poll or deleting its news unpublishes that poll while retaining existing ballots. There is no separate poll tab or standalone poll card in the public news feed. Existing legacy polls remain stored and are not automatically attached to unrelated news.

Public profile routing decodes Next's encoded `@` parameter once before validation. `/@iiZo7al` and the encoded `%40iiZo7al` route resolve the same saved, case-insensitive handle; malformed/non-profile routes stay 404.

## Fresh confirmation, recovery and system notifications

Deleting an account or unlinking a provider/Minecraft requires a new app code, one-use recovery code, or verified email OTP. An opaque five-minute action proof is bound to the remotely validated user, native Supabase session ID, action and identity; the mutation consumes it atomically. A previously authenticated browser alone cannot authorize these changes.

If native recovery codes are unavailable, the site stores only salted-by-account SHA-256 hashes of ten random 128-bit codes. A consumed code cannot be reused; regeneration invalidates previous codes. Email codes are sent only to the current Auth user's confirmed primary email, never a browser-selected address or synthetic Modrinth login identifier. Challenges expire in five minutes and allow at most five attempts. The code must verify back to the exact same Auth subject. Email/local backup verification grants a server-side, twelve-hour website assurance bound to the native session and verified-factor fingerprint; it does not forge or claim a native AAL2 JWT. Native Auth factor changes still require native assurance.

In Supabase → Authentication → Email Templates → Magic Link, include `{{ .Token }}` in the email body for the numeric OTP form. Configure SMTP for delivery to members outside the project team; provider delivery/rate restrictions still apply. This change does not send a test email or change a member's authenticator during development.

TOTP enrollment renders a PNG generated from the native Auth provisioning URI on the server. The QR regression test actually decodes the PNG and verifies that the scanned secret matches the enrollment secret.

Password controls are under Account Security; older password-tab URLs map there. The dashboard link is returned only for the configured immutable owner account and no longer appears in quick search. Final Auth deletion records `auth_purged_at` so completed purges disappear from the member administration list while the ID-only revocation tombstone remains.

The notification dialog requests browser permission on a user click and offers a test notification. New enabled-category notices trigger OS notifications while the site is open (including minimized); it does not promise delivery with the browser closed. A service worker handles notification clicks. Initial history, read notices and previously observed IDs do not generate a notification flood.

Fortnite dashboard statistics come from the public Fortnite.GG creator cards. Plays/unique players cover 24 hours; total minutes and peak players are all-time. Source-rounded figures are disclosed, and unavailable data remains missing rather than fabricated zeroes. GitHub, Twitch and X (OAuth 2.0 provider `x`) appear only when Auth reports them enabled.

## Saved account chooser, X and resilient Fortnite data

Switch account opens a chooser without signing out. The current account is saved when the member opens the chooser; Add account opens sign-in while the existing session remains active until successful authentication. Up to five accounts are kept for this browser for thirty days. Only refresh tokens are stored, encrypted with AES-256-GCM and bound to the hashed opaque HttpOnly device cookie and Auth user ID. Every switch serializes native refresh-token rotation and remotely validates the returned user ID before replacing cookies. Banned, purged, expired and cross-browser sessions cannot switch. The previous website second-factor cookie is cleared; AAL1 sessions must complete the target account's MFA challenge. Sign out revokes and forgets only the active account in that browser. Permanent account deletion purges its saved sessions on every device. No password or token is returned in the account list or stored in localStorage.

Supabase's X OAuth 2.0 provider was observed ENABLED in its project dashboard on 2026-10-14, while the older public /settings response omitted external.x. Production ZO7AL_ACCOUNT_X_ENABLED=true explicitly enables the site's modern x provider without relying on that missing legacy flag. Google/Microsoft Add account continues to request their account chooser through the existing PKCE flow.

Gallery cards and image dialogs link the author's name/avatar to the current public /@handle. The association comes only from the submission's validated user ID. A profile rename updates the link; banned, deletion-pending, deleted and unset-handle profiles have no public link. Contact email and private Auth fields stay absent from public gallery data.

Fortnite.GG refresh failures fall back to the newest validated persistent snapshot or the timestamped bundled observation of all 13 creator cards. Successful refreshes update the persistent cache. The UI labels cached data and displays its original observation date/time; it never advances that timestamp on a failed refresh. Player counts older than five minutes and daily metrics older than 24 hours are hidden. Snapshot data is source-validated and project URLs are rebuilt from map IDs. This makes temporary upstream failures useful without claiming that cached statistics are live.

The live Supabase Free project currently disables Magic Link subject/body editing until custom SMTP is configured (or the project is upgraded). Its default message sends a link. The numeric-code template is ready in supabase/templates/magic-link.html, but it has NOT been applied because no custom SMTP credentials are configured. After configuring an authorized SMTP sender, paste that template into Magic link or OTP and use the subject “Zo7al verification code”. Verify an actual received code in the browser-bound website challenge before claiming delivery works. Never put SMTP passwords in the repository or chat.

### Pending external configuration (14 October 2026)

- The owner cancelled X sign-in after the provider returned `403 client-not-enrolled`. X is removed from allowed sign-in/link providers and remains available only as an optional public social link. Modrinth occupies its sign-in tile and Passkey spans the full row.
- All 13 branded auth/security email templates and subjects are prepared under `supabase/templates`. They remain unapplied while Supabase blocks template editing without custom SMTP. Verify an actual received numeric code before marking email verification fixed.
