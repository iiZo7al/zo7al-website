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
