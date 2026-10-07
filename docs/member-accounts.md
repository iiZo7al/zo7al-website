# Member accounts and store gifts

Member authentication uses Supabase Auth. Existing website data remains in the server-only Neon PostgreSQL connection (`DATABASE_URL`); no browser database access or service-role key is needed. Dashboard administrator authentication and its YouTube/Modrinth integrations remain separate from member accounts.

## Required configuration before merging

This change requires member sign-in for checkout. Do not merge into production until the following setup is complete and the full flow has been verified on the preview deployment.

1. Select or create the owner's Supabase project. Configure these **server-only** Vercel variables: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Keep the existing `DATABASE_URL`. Never put a service-role/secret key or database password in client variables.
2. In Supabase Authentication → URL Configuration, set Site URL to `https://zo7al.is-a.dev` and allow `https://zo7al.is-a.dev/api/account/callback`. Add the exact preview deployment's `/api/account/callback` separately for testing. Use production-only `ZO7AL_SITE_URL=https://zo7al.is-a.dev` for a fixed production origin; omit this variable on previews so their own origin is used.
3. Enable Email, email confirmation, and secure password change. Configure production SMTP and its sender domain, then test confirmation, recovery, and reauthentication delivery.
4. Enable Discord and Google with owner-controlled OAuth credentials. Their provider callback is the Supabase project's `/auth/v1/callback`, distinct from the website callback above. Enable manual identity linking to let members connect an additional provider from account settings. Only enabled providers appear on the website.
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

1. Complete email signup/confirmation, sign-in, recovery, password reauthentication, and logout. Reload and verify session refresh. Verify enabled Google/Discord login and same-account provider linking; decline or cancel a provider flow and confirm no unexpected identity switch.
2. Attempt a wrong player name, wrong code, expired code, duplicate player, and reused code. Verify only the matching online player can link. Confirm profile/rank/statistics after a bridge sync.
3. Add a rank, ordinary purchase for the linked name, gift to a second linked account, coins quantity, and one-rank restriction. Use Tebex's supported test checkout process; do not create a real charge during verification. Confirm the recipient name before payment.
4. Verify separate accounts cannot list, claim, or track each other's requests by reference alone. Claim a guest receipt with its private token and reload the requests page.
5. Check mobile avatar/cart placement, account tabs, keyboard focus, native dialog opening, common-error accordion, and all ten locales.

Local tests use simulated provider/Tebex responses and PostgreSQL-compatible PGlite. A successful local test run does not confirm production OAuth credentials, SMTP delivery, live payment delivery, or an installed backend plugin. Those checks require the configured preview and servers.
