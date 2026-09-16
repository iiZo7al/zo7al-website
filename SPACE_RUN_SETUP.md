# Live Space Run backend

The game now calls a deployed Neon Function directly. Database credentials and SPACE_RUN_SECRET remain in Neon. The frontend contains only the public API URL in `src/components/home/space-api.ts`.

- Project: `blue-grass-05010492` (`zo7al-space-run`)
- Production branch: `br-steep-star-a580g5uk`
- Database: `space_run`
- Function: `spacerun`
- API: https://br-steep-star-a580g5uk-spacerun.compute.c-1.us-east-2.aws.neon.tech
- Source: `functions/space-run/index.ts`; it shares the existing validated route handlers.

GET /leaderboard and POST /start are public anonymous-game endpoints. POST /finish requires the unguessable run token, validates scores, and is idempotent. CORS supports the deployed website and previews without sending cookies. The database is never exposed directly. This is score plausibility checking, not server-authoritative anti-cheat.

For backend changes, bundle with esbuild (Node 24 ESM with the documented CommonJS require banner), zip the entry as index.mjs, and deploy with Neon. Preserve SPACE_RUN_SECRET when deploying. Do not commit secrets.

A separate verification branch `br-red-thunder-a5fedlod` expires on 2026-09-17 at 02:45:35 UTC; its QA scores are isolated from production.

The existing Next.js routes remain available for self-hosting with the configuration below, but the game uses the live Neon endpoint by default.

---

# Space Run: shared leaderboard

The world leaderboard uses PostgreSQL. It is shared between browsers and server instances; it does not use localStorage. Existing personal browser scores are not uploaded because they were never verified by the server.

## Enable the leaderboard

1. Create a PostgreSQL database with your hosting provider. Use its pooled connection URL when running on a serverless host. Keep certificate verification enabled; use the provider's SSL settings.
2. Set these **server-only** environment variables in the website hosting settings and in `.env.local` for local development:
   - `DATABASE_URL`: the PostgreSQL connection URL.
   - `SPACE_RUN_SECRET`: a long random secret. Generate one using `openssl rand -hex 32`.
3. Run `npm ci`, then `npm run db:setup` against that database to apply `database/space-run.sql`. Re-running the schema setup is safe.
4. Deploy the updated site with the same environment variables. Keep secrets out of Git and never prefix them with `NEXT_PUBLIC_`.
5. Play a short round, submit a pilot name and score, then open the leaderboard from another browser. The recorded score should appear in both.

Without configuration, the game remains playable. The world leaderboard displays a translated unavailable message and disables submission; it does not silently fall back to a local board.

## Operations

- `POST /api/space-run/start` creates a random, single-run submission token. Only the token hash is stored.
- `POST /api/space-run/finish` validates the name, score, stars, token and elapsed time, and saves once in a transaction. Retries are idempotent.
- `GET /api/space-run/leaderboard` returns the top 50 completed runs. Open leaderboards refresh every 30 seconds.
- Run starts are limited to 10 per minute per hashed client address. Your trusted reverse proxy must overwrite `X-Forwarded-For`; do not allow clients to supply arbitrary forwarded addresses directly.
- Tokens for unfinished runs expire after two hours. Periodically clean up abandoned starts: `DELETE FROM space_runs WHERE completed_at IS NULL AND started_at < now() - interval '1 day';`.
- These checks reject malformed, replayed and impossible submissions. They are not complete anti-cheat: the simulation still runs on the client. Competitive prizes would require server-authoritative simulation or replay verification.

## Audio and visuals

Music and effects are original Web Audio synthesis. There are no external audio downloads. Audio begins after user interaction, stops on pause/exit, and exposes independent music/effects toggles.

The uploaded Cartoon Space Pack was split into normalized indexed GLB meshes. Six new obstacle variants accompany the original meteors; Earth, the Moon and two planets form the background. Asset credit is in `public/assets/models/space-pack/CREDITS.txt`.

Game UI, sound controls, transitions, leaderboard states and remaining site interface text have translations in all ten existing languages. Published external project names and descriptions retain their source text.

## Version 1.0.4: personal best and installed app

Run `database/space-run.sql` before deploying the new function: it adds nullable `player_hash` and an index without rewriting existing results. `/start` accepts a 256-bit private anonymous player key in `X-Space-Player`; only its HMAC is stored. Rankings select one best completed run per player (score, stars, earliest completion), preserving old run tickets for idempotency. Old clients without a key retain independent runs. Names and IP addresses are never used to merge players. Clearing browser storage or using another browser creates a separate player identity; account-based cross-device identity is not implemented.

The manifest installs **Zo7al Game** with the supplied artwork and starts at `/game`. Installed launches from older saved homepage URLs redirect to `/game`. Game-only mode hides site navigation and exit controls, including on pause and game over. Keyboard P cannot return to the website in this mode. iOS uses standalone mode with safe areas; browser/OS status bars remain controlled by the OS. Offline play is not advertised.

Selected solid icons are self-hosted SVG outlines from Flaticon Uicons 3.0.0, with visible footer attribution. Country flags are self-hosted from FlagCDN.
