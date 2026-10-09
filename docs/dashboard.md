# Zo7al dashboard

Open `/dashboard` directly, or type `/dashboard` into the site's Ctrl+K search.
`/admin` redirects to the new page. The dashboard stays out of public navigation.
The existing administrator password and session settings remain in use.

The overview uses real website request/checkout counts and a 28-day activity
history in Riyadh time. Checkout baskets do not confirm payment or delivery.
Missing upstream statistics appear as `—`, rather than zero.

## Platform connections

Minecraft player counts, Modrinth projects, and Fortnite island metrics use
public APIs. Epic may return missing intervals for some islands; the dashboard
shows coverage and sums only complete, available island statistics.

Use **Connections** to verify and save credentials for:

- **YouTube:** YouTube Data API key and channel handle. This loads public
  subscribers, channel views, and video counts. Private revenue and watch-time
  analytics are available through the separate Google OAuth Studio connection below.
- **CurseForge:** authorized API key for the published modpack download counts.
- **Pelican:** HTTP or HTTPS panel origin (public domain or IPv4) and a nonempty
  Client API key of any length within the request body limit. Server UUIDs are discovered
  automatically; a previously configured UUID remains optional.

Saved keys are encrypted using AES-256-GCM and the existing server-side session
secret. Keys never appear in connection metadata or browser URLs. Rotating that
secret requires reconnecting previously stored providers.

Optional environment-managed connections:

| Provider | Variables |
| --- | --- |
| YouTube | `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_HANDLE` |
| CurseForge | `CURSEFORGE_API_KEY` |
| Pelican | `PELICAN_PANEL_URL`, `PELICAN_CLIENT_API_KEY`; optional `PELICAN_SERVER_ID` |

Environment-managed credentials cannot be replaced through the dashboard.

## YouTube Studio connection

In **YouTube → Connection** or **Connections → YouTube connection**, configure
an OAuth **Web application** client from your own Google Cloud project:

1. Enable **YouTube Data API v3** and **YouTube Analytics API**.
2. Copy the exact authorized redirect URI displayed by the dashboard into the
   Google OAuth client, including scheme, host and `/api/admin/youtube/oauth/callback`.
3. Configure the OAuth consent screen. Add the channel owner's account as a test
   user while the app is in testing; complete Google's verification when needed.
4. Save the Client ID and Client Secret, then select **Connect with Google** and
   choose the Google/Brand channel you want to manage.

Optional hosting variables `YOUTUBE_OAUTH_CLIENT_ID` and
`YOUTUBE_OAUTH_CLIENT_SECRET` take precedence over database configuration.
The website does not create or approve a Google Cloud application for the owner.
A public YouTube API key cannot authorize private Studio operations. With no
public key, the overview also loads real channel totals from the OAuth connection.

The requested scopes are `youtube.force-ssl`, `yt-analytics.readonly`, and
`yt-analytics-monetary.readonly`. Google/YouTube still enforce channel eligibility
and permissions; analytics revenue is unavailable without the appropriate access.
Tokens and client secrets are encrypted in Postgres with AES-256-GCM, using
separate authenticated purposes. Access tokens refresh on the server. No Google
tokens appear in browser storage, redirect URLs, status JSON or upload tickets.
OAuth uses PKCE and a one-use state bound to an HttpOnly browser nonce. Disconnecting
or changing app credentials cancels even an OAuth callback already in flight.

| Tab | Tools |
| --- | --- |
| Overview | Real channel totals and recent owned videos |
| Content | Uploads/search/pagination, title/description/tags, visibility, publication schedule, audience and synthetic-content disclosures, thumbnails, confirmed permanent deletion |
| Analytics | 7/28/90/365-day reports, real daily chart, watch time, subscribers, likes, top videos, countries, traffic sources, revenue when permitted, CSV export |
| Comments | Published/review/spam queues, replies, approve/hold/reject with confirmation |
| Playlists | Create/edit/delete, paginate, add videos and remove playlist entries |
| Live | List and schedule broadcasts, bind existing streams, test/start/end/delete with confirmation and state checks |
| Subtitles | Choose an owned video, list tracks, upload timed UTF-8 SRT/VTT, download SRT, delete |
| Channel | Description, keywords and trailer; preserved branding fields |
| Studio tools | Links to official copyright, monetization, customization, audio library, editor and settings |

YouTube's public APIs do **not** expose the entire Studio application. Copyright
management, the video editor, monetization onboarding, stream-key setup and some
channel settings remain in the linked official Studio. This dashboard does not
pretend those features have been replicated or bypass Google's restrictions.

Video uploads use a server-authorized Google resumable session and 2 MiB chunks,
with progress based on Google's confirmed byte ranges. Pause/resume works while
the window is open; tickets stay only in memory and expire after six hours. The
local video selection is capped at 32 GiB, and actual YouTube limits still apply.
Unverified API projects may be restricted to private uploads. Choosing audience
and visibility is explicit, and future publication requires private visibility.
Custom thumbnails accept decoded JPEG/PNG/WebP up to 2 MiB. Timed captions accept
UTF-8 SRT/VTT up to 1 MiB. Google may require custom-thumbnail eligibility.
Ownership is checked before every video, caption, playlist or broadcast mutation.

## Minecraft player-profile server names

Under **Connections → Minecraft player bridge**, the pencil action renames a
server connection. This changes the displayed server label without rotating its
plugin key, changing its UUID, merging player records or changing synced stats.
Existing plugins keep working without an updated configuration file.

## Fortnite API

The dashboard calls Epic's public `/islands/{code}/metrics/day` endpoint using its
default window and response, without undocumented date or metric filter encodings.
Valid empty/privacy-suppressed arrays mean the API connection is working and
metrics are unavailable. Errors and malformed responses stay unavailable;
known zero values remain zero. Missing intervals are never silently counted as
zero or presented as complete totals. Tests cover real zeroes, nulls, empty
arrays, malformed bodies and provider failures with mocked responses. A live
Epic response was not verified from the restricted development workspace.

## Pelican console

Required Pelican permissions: `websocket.connect` and `control.console`.
The optional power buttons require `control.start`, `control.stop`, and
`control.restart` respectively. Use a Client API key, not an Application key.
The panel URL accepts HTTP or HTTPS with a publicly resolvable domain or public IPv4 address.

The website proxies resource reads and command/power requests through protected
server routes. The browser connects directly to Wings using Pelican's short-lived
WebSocket token. No persistent WebSocket server on Vercel is needed.
Logs and live usage samples are kept only in memory while the console is open.
Failed commands are not queued or retried automatically.

## Pelican server and account tools

The Pelican workspace displays a searchable server card grid with My/Other/All
filters, status, uptime and CPU/RAM/disk meters. It refreshes every 30 seconds
while visible; newly created servers appear without manual registration. Root
admin keys use Pelican `admin-all`, while ordinary keys retain only directly
accessible servers. Resources unavailable from one node remain unknown without
hiding the other servers. Click a card to open all its tools.

The Pelican workspace lists servers accessible to the connected Client API key.
Changing the selected server applies to every tab, console command and power
action. Pelican enforces the key owner's access and the selected server's limits.
The website never accepts an arbitrary API path from the browser.

| Tab | Available tools |
| --- | --- |
| Console | Live logs and CPU/RAM/disk/network usage, command history, start/stop/restart/force stop, expand, export displayed logs |
| Files | Folders, text editor, file creation, upload with real progress, download, rename/move, copy, delete, archive/extract, chmod, download from public HTTPS URL |
| Backups | Pagination, create with exclusions, rename, lock/unlock, download, restore with optional truncation, delete |
| Schedules | Create/edit/execute/delete schedules; create/edit/reorder/delete tasks, delay, continue on failure, command/power/backup/file deletion actions |
| Databases | Create, connection information, show/hide password, rotate password, delete |
| Users | Invite, view, edit permission groups, remove server access |
| Network | Assign port, change notes, set primary allocation, release non-primary allocation |
| Startup | Visible egg variables, edit eligible values, allowed Docker image selection, startup command with known secret variables masked |
| Settings | Rename, description when enabled, resource limits, SFTP connection details/link, reinstall |
| Activity | Event filter, pagination, actor, timestamp and masked sensitive properties |
| Account | Username/email/password, account activity, Client API keys and allowed IPs, one-time new key display, SSH public keys |

The editor accepts text files up to 1 MB. Larger and binary files can be
downloaded. Uploads go directly to Wings through a single-use signed URL; their
size limit comes from Wings, avoiding Vercel's function body limit. The multipart
field is `files`, and `directory` is a URL parameter, matching Wings' upload API.
The exact website origin must also be allowed for file uploads.

Deletion, restoration, reinstalling, account credentials, key management and
permission grants have explicit confirmations. No live destructive requests are
made during automated tests. Database and newly created API secrets are returned
only to the authenticated owner, with no caching or browser persistence.

These tools cover Pelican's server/account Client API. Node/host administration,
egg and mount configuration, server icons and MFA setup remain in the linked
Pelican panel; they are not exposed by its current Client API routes. Resource
limits require a host administrator. A missing permission produces a specific
error rather than a success or invented result. Tests use mocked upstream
responses; an operational integration additionally requires real credentials
and the configured Wings origin.

The dashboard reuses the public site's theme tokens, typography, card hover glow,
pill buttons, native dialogs and search icon. Pelican tools stay inside
`/dashboard`; they add no public navigation pages.

Wings must serve a valid HTTPS/WSS endpoint. In the existing Wings configuration,
add the exact website origin to `allowed_origins`, retaining the other entries:

```yaml
allowed_origins:
  - https://zo7al.is-a.dev
```

Apply Wings configuration changes using your normal server maintenance process.
Avoid allowing every origin with `*`. For a separate preview URL, add only that
specific trusted origin if a live console check is needed.

All mutations require a valid website administrator session, same-origin JSON
requests, and persisted rate limits. Power actions ask for confirmation in the
dashboard. Panel requests reject private DNS addresses, pin the checked public
IPv4 address, enforce response/time limits, and do not follow redirects.

Official references:

- [Pelican API documentation](https://pelican.dev/docs/panel/advanced/api-docs/)
- [Pelican client routes](https://github.com/pelican/panel/blob/main/routes/api-client.php)
- [Pelican WebSocket controller](https://github.com/pelican/panel/blob/main/app/Http/Controllers/Api/Client/Servers/WebsocketController.php)
- [Wings origin configuration](https://github.com/pelican/wings/blob/main/config/config.go)
- [Fortnite Data API](https://api.fortnite.com/ecosystem/v1/docs/)
- [YouTube channel statistics](https://developers.google.com/youtube/v3/docs/channels/list)
- [Modrinth user projects](https://docs.modrinth.com/api/operations/getuserprojects/)
- [CurseForge REST API](https://docs.curseforge.com/rest-api/)

- [Google server-side OAuth](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps)
- [YouTube resumable uploads](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)
- [YouTube video updates](https://developers.google.com/youtube/v3/docs/videos/update)
- [YouTube Analytics channel reports](https://developers.google.com/youtube/analytics/channel_reports)

## Player statistics and Zo7al Network

Both Player Bridge 1.1.0 plugins send 17 supported numeric statistics: current/best
streak, playtime, player/mob kills, deaths, wins/losses, mined/placed blocks, jumps,
fish caught, animals bred, enchanted items, damage dealt/taken and distance.
Native Minecraft counters are imported from statistics JSON for offline players
and read through Bukkit for online players. Every counter has an optional numeric
PlaceholderAPI override. Wins and losses require the actual game plugin’s
placeholders. An invalid configured placeholder stays unknown.

Native streaks count player kills until death. Best streak and placed-block counts
are local measurements since this version was installed, persisted atomically in
player-counters.json every minute and on shutdown; they do not invent history.
Changing/reloading the website credential does not reset local counters. Both game
streak and best-streak placeholders can override these measurements.

Each connection has **Statistics settings**, also reachable in the one-time key
dialog. Selecting streak and playtime for Lobby hides all other statistics in that
server’s public API response and UI. An empty selection hides all its stats.
Existing connections default to all supported statistics. The additive database
migration stores visible_stats; saving changes no credential or player data.

The public profile page initially selects **Zo7al Network**. It totals all known
selected counters for the same UUID across enabled backends. Each server
contributes only the statistics selected in its settings; current/best streaks use maxima. Each stat reports its
available-source coverage among the servers that enabled that statistic. Missing counters remain unknown, and stale online
states remain unknown. The network rank is the latest profile’s rank. Resolving
a name selects one UUID before reading other backend records, including its old
names. Namesakes with different UUIDs are never combined. Disabled bridges are
excluded. The existing default rank lookup used in cart previews stays per-server.

Replace each old JAR with its matching 1.1.0 build after stopping the backend; keep
the plugin directory, token and counter file. GitHub Actions tests and packages
both variants on plugin pull requests and publishes versioned build artifacts.

## Creator applications

The review screen includes platform/status filters, status counts, rank artwork,
clickable channel/contact links and an explicit Discord-notification retry.
Submitted Minecraft usernames are prefilled from the store and application fields
are normalized before storage. The private tracking token never enters Discord.
If storage succeeds but Discord delivery fails, the API returns `202` with a
saved reference and tracking token, clearly marks the notification as pending,
and retains the application for review and a manual retry. Without durable
storage, failed delivery still returns an error. A storage failure does not send
an untracked application. Admin retries lock the request to prevent overlapping
clicks from producing duplicate deliveries. A confirmed webhook delivery followed
by a database outage can still require manual receipt reconciliation.

## Modrinth OAuth connection

Use **Modrinth → Connection** or **Connections → Modrinth connection**.
The main account card contains **Connect with Modrinth**; the settings button
opens application configuration in a dialog. YouTube uses the same layout with
**Connect with Google**. Returning from either authorization flow reports success,
cancellation or failure without showing provider codes or credentials.

1. Register a Modrinth OAuth application at
   <https://modrinth.com/settings/applications> with `USER_READ` and `PROJECT_READ`.
2. Add the exact website callback URI displayed in settings:
   `https://zo7al.is-a.dev/api/admin/modrinth/oauth/callback` for that domain.
3. Save the application Client ID/Secret once and connect the account.

Optional `MODRINTH_OAUTH_CLIENT_ID` and `MODRINTH_OAUTH_CLIENT_SECRET` override the
saved application. Register separate exact callback URLs for any approved preview
or local development host. OAuth clients must belong to the website owner;
installing a ChatGPT plugin alone does not register a Google or Modrinth client.

OAuth redirects to `https://modrinth.com/auth/authorize` and exchanges a one-time
code at `https://api.modrinth.com/_internal/oauth/token`. These follow the URL table
in the official guide; its prose authorization URL currently disagrees with that
table. The browser nonce is HttpOnly, pending state expires after ten minutes,
and client secrets/access tokens are purpose-bound encrypted values in Postgres.
Disconnecting or replacing the app cancels pending and in-flight callbacks.
The dashboard fetches the connected user's actual projects using a server-only
Authorization header. Unconnected dashboards retain the existing public project
feed; expired or rejected authorizations report unavailable data and require
reconnection. Modrinth does not document a refresh-token grant in this guide, so
this integration does not invent one. Disconnect removes local access; revoke
the application in Modrinth settings when provider-side revocation is desired.

Official references:

- <https://docs.modrinth.com/guide/oauth/>
- <https://docs.modrinth.com/api/operations/getuserfromauth/>
- <https://developers.google.com/identity/protocols/oauth2/web-server>

## CurseForge connection

CurseForge has a matching connection card in its platform page and in
**Connections**, with API-key settings in a dialog. Saving verifies the key
against the official API before encrypted storage and refreshes dashboard
statistics. Environment-managed keys remain read-only. The card links to the
official application instructions for API access.

The public Minecraft statistics API documents `x-api-key` authentication, not a
general account OAuth flow. The separately documented author upload API uses
an `X-Api-Token`; that token is not interchangeable with the statistics API key.
This card uses the supported statistics API and does not claim an OAuth grant
or access to private author-management features.

- <https://docs.curseforge.com/rest-api/>
- <https://support.curseforge.com/support/solutions/articles/9000208346-about-the-curseforge-api-and-how-to-apply-for-a-key>
- <https://support.curseforge.com/support/solutions/articles/9000197321-curseforge-api>
