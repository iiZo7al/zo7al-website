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
  analytics remain in YouTube Studio; this integration does not request OAuth.
- **CurseForge:** authorized API key for the published modpack download counts.
- **Pelican:** HTTPS panel origin, server UUID (or legacy short identifier), and
  a Client API key belonging to a user with access to the selected server.

Saved keys are encrypted using AES-256-GCM and the existing server-side session
secret. Keys never appear in connection metadata or browser URLs. Rotating that
secret requires reconnecting previously stored providers.

Optional environment-managed connections:

| Provider | Variables |
| --- | --- |
| YouTube | `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_HANDLE` |
| CurseForge | `CURSEFORGE_API_KEY` |
| Pelican | `PELICAN_PANEL_URL`, `PELICAN_SERVER_ID`, `PELICAN_CLIENT_API_KEY` |

Environment-managed credentials cannot be replaced through the dashboard.

## Pelican console

Required Pelican permissions: `websocket.connect` and `control.console`.
The optional power buttons require `control.start`, `control.stop`, and
`control.restart` respectively. Use a Client API key, not an Application key.
The panel URL must use valid HTTPS with a publicly resolvable domain.

The website proxies resource reads and command/power requests through protected
server routes. The browser connects directly to Wings using Pelican's short-lived
WebSocket token. No persistent WebSocket server on Vercel is needed.
Logs and live usage samples are kept only in memory while the console is open.
Failed commands are not queued or retried automatically.

## Pelican server and account tools

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
