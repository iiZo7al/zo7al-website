# Creator rank applications

The Store shows YouTube, Twitch and TikTok applications below Coins. Each opens the shared details dialog, and collects email, Minecraft and Discord names, channel URL, follower count, content schedule, reason and consent. Submission never purchases or automatically grants a rank.

Set `DISCORD_APPLICATION_WEBHOOK_URL` in Vercel Environment Variables for the intended environments, then redeploy. Use the Discord channel's webhook URL (Server Settings → Integrations → Webhooks). Never use a NEXT_PUBLIC prefix or commit the webhook URL. No Twitch or X API credentials are required for this form.

The server validates the selected platform's profile URL and field lengths, restricts webhook delivery to discord.com, disables mentions, limits payload size and times out delivery. Success requires a Discord message receipt. No live test submissions were sent.

The in-memory abuse guard allows three attempts per IP per 15 minutes per server instance. It is not a distributed quota; configure a hosting/WAF rate limit for `/api/creator-applications` on multi-instance deployments.

Category image: generated with the built-in image tool. Prompt: compact transparent Minecraft-style voxel camera and microphone with red play, purple chat and cyan music badges, golden accents, no text, legible at 140×80. Asset: `public/assets/site/creator-category.webp`.
