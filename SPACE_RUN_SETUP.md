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
