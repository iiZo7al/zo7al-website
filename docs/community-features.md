# Community and project controls

Open `/dashboard?view=community` and sign in with the existing dashboard account. The Community workspace manages polls, gallery submissions, project states, project updates and achievement goals. New entries remain private until **Published** is enabled. Gallery submissions always arrive unpublished and awaiting moderation.

The first database initialization installs one published, open-ended community poll and six achievement goals, translated into all ten site languages. There is one poll ID and ballot set across languages. A transactional installation marker prevents repeat installation on cold starts or deployments. Existing polls and existing achievement configurations take priority, including unpublished entries. Once an owner changes or unpublishes starter content, deployments do not restore it.

## Public placement

- The navigation bell contains news, events, project updates and private request updates. Category preferences and read markers are saved in Postgres for the signed browser identity. Existing browser preferences are migrated on first use. A local cache retains changes during an outage and retries server synchronization. Private status lookups send saved receipt codes in POST bodies; codes never appear in notification links. Order payment and delivery states come from the existing Tebex tracking endpoint.
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

Polls have 2–8 options and an optional deadline entered in Riyadh time. Each signed browser identity can record one ballot per poll. A visitor's saved selection is loaded from Postgres after reloads and language changes. The signed HttpOnly cookie is renewed for one year during active use. Clearing site cookies or switching browsers creates another identity; this is not verified-account voting. IP limits provide an additional restriction. Options cannot change after a ballot is recorded, and unpublished or expired polls reject further votes.

Achievement targets are edited in the displayed statistic's units; playtime targets use hours in the dashboard and seconds in storage. Starter goals are regular, editable database entries. Unpublishing all goals hides achievements rather than reinstating defaults. Missing counters never unlock an achievement.

## Configuration and validation

The existing `DATABASE_URL`, `ZO7AL_ADMIN_SESSION_SECRET` and Discord support webhook configuration are reused. Community tables and indexes are created by the existing idempotent schema initializer. No new service credentials are required. Voting and server-backed visitor preferences remain unavailable if the session secret is absent. Stored content, ballots and settings have no automatic deployment reset or demo expiration. Gallery and project histories contain only moderated submissions and owner-published updates.

## FAQ

Home and Support Center share the same 33 translated questions, covering the cart, creator applications, private tracking receipts, profiles, Network aggregation, rankings, goals, votes, gallery moderation and notifications. Search ignores Arabic vowel marks and Latin accents, supports multiple terms and offers clear/reset controls. Answers link directly to existing site sections. `/support?tab=report` opens the support form.

The automated suite exercises validation, ballot uniqueness, closed polls, moderation, retained submissions during webhook outages, private receipt checks, and statistic visibility. Persistence tests execute the actual schema and queries on a local Postgres WASM engine, close and reopen its stored database, and confirm that ballots, preferences, owner edits and publication choices survive. They also check first-run installation, existing owner configuration, rollback and retry. The hosting database and Discord still require deployment verification; no production credentials are copied into local tests.
