# Community and project controls

Open `/dashboard?view=community` and sign in with the existing dashboard account. The Community workspace manages polls, gallery submissions, project states, project updates and achievement goals. Entries remain private until **Published** is enabled. Gallery submissions always arrive unpublished and awaiting moderation.

## Public placement

- The navigation bell contains news, events, project updates and private request updates. Category preferences and read markers are saved in the current browser. Private status lookups send saved receipt codes in POST bodies; codes never appear in notification links. Order payment and delivery states come from the existing Tebex tracking endpoint.
- Minecraft contains the leaderboard, polls and gallery. Fortnite contains polls and gallery filtered to that section. “All projects” content appears in both.
- Player profiles display achievements only for counters that the selected server exposes. Network leaderboards sum enabled counters from enabled backends; streaks use the maximum. Unchecked counters do not enter network totals.
- Project details contain the manually managed changelog, project state and contextual support link. A Modrinth project's upstream release changelogs remain available alongside these updates.

## Project keys

| Project | Key |
| --- | --- |
| Minecraft network | `minecraft:network` |
| Fortnite island | `fortnite:0000-0000-0000` using its real island code |
| Modrinth project | `modrinth:slug` using its actual slug |
| CurseForge project | `curseforge:id` using its actual project ID |

Create one published state entry per project and language. Edit that entry to change its state. Separate changelog entries can use the same key. English entries provide a fallback when that project has no published translation.

## Moderation and voting

Review gallery images, creator names, contact email and supported video links in the private workspace. **Publish**, **Reject** and **Unpublish** control public visibility. Image uploads preserve their original aspect ratio and are decoded and stored as WebP. Public readers cannot fetch a pending or rejected submission's image. Click an approved image to view it at its original ratio.

Submissions notify the existing Discord support webhook. A delivery outage retains the pending submission and its receipt; **Retry Discord** in the dashboard retries it. Publication does not depend on webhook availability.

Polls have 2–8 options and an optional deadline entered in Riyadh time. Each signed browser identity can record one ballot per poll. This is a browser-based poll, not verified-account voting: clearing cookies creates a new identity. IP limits provide an additional restriction. Options cannot change after a ballot is recorded, and unpublished or expired polls reject further votes.

Achievement targets are edited in the displayed statistic's units; playtime targets use hours in the dashboard and seconds in storage. Without published custom goals, profiles use the built-in milestones. Missing counters never unlock an achievement.

## Configuration and validation

The existing `DATABASE_URL`, `ZO7AL_ADMIN_SESSION_SECRET` and Discord support webhook configuration are reused. Community tables and indexes are created by the existing idempotent schema initializer. No new service credentials are required. Voting remains unavailable if the session secret is absent.

The automated suite exercises validation, ballot uniqueness, closed polls, moderation, retained submissions during webhook outages, private receipt checks, and statistic visibility. Live database, webhook and browser verification require the deployment's configured services; local tests stub those external boundaries.
