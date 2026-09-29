# Social previews

Account URLs are the cache keys, so personal and Zo7al Games accounts never share results merely because they use the same platform. Public sources refresh every 15 minutes; responses cache for five minutes when content is available and one minute otherwise.

- YouTube reads the channel's **Videos** tab only. Shorts, live and upcoming renderers are excluded. Mixed RSS is intentionally not used.
- X uses the account timeline API when configured (latest original post, excluding replies/reposts). Otherwise it uses the official public timeline embed; that fallback is labeled posts, not a guaranteed newest tweet.
- Twitch uses Helix videos with `type=archive&sort=time&first=1`, never a live stream or highlight. Without credentials it attempts public structured data and provides the account's archive link when no verified VOD is available.
- Instagram and TikTok use official public profile embeds if structured posts are unavailable. Snapchat uses its official public profile embed. Availability depends on account privacy, embedding settings and browser blocking.
- Threads reads dated public structured posts when exposed; it does not invent a post when the source blocks access.
- Bluesky uses the public author feed, excluding reposts and pinned ordering.
- Discord uses invite/server info and real member/online counts.
- Modrinth shows recently updated projects; CurseForge shows its existing project source and explicitly labels saved fallback data.
- Fortnite shows islands for the requested creator. Known saved islands only apply to the matching verified creator.
- Roblox shows community information and its public games. Linktree shows account links.

Unavailable content is distinct from a successful empty feed. Bios come from the public account when available, falling back to the site's localized description. No cross-account content or invented statistics are used.

## Optional server configuration

Set these on the deployment provider, not in client code or Git:

- `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`: your Twitch application, used to request an app token. Alternatively use `TWITCH_CLIENT_ID` with `TWITCH_ACCESS_TOKEN` (an expiring token you maintain).
- `X_BEARER_TOKEN`: your X application's bearer token with access to user timelines.

Twitch API reference: https://dev.twitch.tv/docs/api/videos/
X embeds: https://help.x.com/en/using-x/embed-x-feed
TikTok creator embeds: https://developers.tiktok.com/doc/embed-creator-profiles/

Official provider scripts initialize only our escaped account embed templates; fetched HTML is never executed. Platforms control their embedded card's internal appearance; the surrounding preview uses the site's layout and each platform's brand color.

## Cursor

The decorative cursor is a non-interactive manual popover. Opening a native dialog raises it into the browser top layer after the dialog. Browsers without popover support fall back to the normal pointer inside details dialogs. Third-party frames use their own native pointer.
