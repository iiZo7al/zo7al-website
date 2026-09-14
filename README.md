# ZO7AL — Gaming Universe

A cinematic, premium personal gaming website for **Zo7al** (`@iiZo7al`) — Minecraft network, modpacks, Fortnite Creative maps and socials, all under one original visual identity.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4 (CSS-variable design tokens)
- Framer Motion (page transitions, scroll reveals, magnetic buttons)
- [next-intl](https://next-intl.dev/) (10-language i18n, cookie-persisted, RTL-aware)
- [simple-icons](https://simpleicons.org/) + [lucide-react](https://lucide.dev/) (brand + UI icons)
- Self-hosted [Geist](https://vercel.com/font) font

## Features

- Centralized design-token system with a per-page accent theme — only the accent color changes between Home, Minecraft, Modpacks, Fortnite, Socials and Store.
- Custom multi-layer cursor (dot / ring / glow) with contextual hover states, magnetic buttons, and full mobile/touch + `prefers-reduced-motion` fallback.
- **Icons**: real, official brand marks (YouTube, Discord, TikTok, Instagram, X, Twitch, Modrinth, CurseForge, Fortnite, Kick, Snapchat, Telegram, WhatsApp, Roblox, Bluesky, PlayStation, Linktree, Facebook, Threads, Patreon) via `simple-icons` — MIT-licensed, no attribution required, tree-shaken per icon. UI icons (search, chevron, copy, check, external-link, menu, globe) via `lucide-react`.
  > Flaticon itself isn't practically automatable (no free API, per-icon manual download, attribution required on the free tier), so `simple-icons`/`lucide-react` were used instead to get the same "premium icon" outcome without licensing friction. If literal Flaticon assets are required, they'd need to be picked and downloaded manually per icon.
- **Live-synced data**, never fabricated — every source below has a verified static fallback if the live fetch fails:
  - **Socials** — server-side fetch of [linktr.ee/Zo7al](https://linktr.ee/Zo7al), parsing the page's embedded Next.js data for links, filtered to a known-platform allowlist (so Linktree's own marketing links never leak in) and matched to a brand icon automatically. New platforms added to the Linktree appear on the site automatically the next time the 6-hour cache revalidates.
  - **Modpacks / Modrinth** — fetched **client-side** from the public, CORS-enabled Modrinth API (`api.modrinth.com`) — always current, no caching needed.
  - **Modpacks / CurseForge** — CurseForge's REST API requires a project-owner API key and isn't publicly anonymous, so this is a server-side parse of the public profile page's project links instead. Same 6-hour cache + fallback pattern.
  - **Fortnite maps** — server-side parse of the official creator page (`fortnite.com/@zo7al`) for island codes, titles and thumbnails. New maps appear automatically; existing codes keep their curated category from the verified list.
  - **Minecraft server status** — fetched client-side from the public [mcstatus.io](https://mcstatus.io) API.
  > ⚠️ The sandbox this project was built in can't reach `linktr.ee`, `fortnite.com`, `curseforge.com`, `discord.com` or `youtube.com` directly, so the live-fetch path in the sync sources and social previews above could not be tested end-to-end against real traffic — only the parsing logic and the fallback path were verified. All of them degrade gracefully to real, verified static data (or simply omit the preview) if a fetch ever fails, so the site can't break or show fake data either way; it's worth spot-checking the "synced live from…" labels and the hover previews once deployed.
- **Back to top**: a floating button appears after scrolling ~480px, smooth-scrolls to top (instant if `prefers-reduced-motion` is set), positioned with a logical `end` offset so it sits correctly in both LTR and RTL.
- **Live social previews**: hovering a card on the Socials page shows a small popover with real content pulled from the platform itself, not a redirect — Discord (server name + live member/online count, via Discord's public invite API), YouTube (latest video thumbnail + title, via the channel's public RSS feed), and Modrinth/CurseForge/Fortnite (latest project or map, reusing the sync sources above). Platforms with no reliable public/keyless preview source (Instagram, TikTok, X, Twitch, etc.) simply keep their normal hover state instead of showing anything fabricated.
- **FAQ**: a premium, searchable, categorized accordion (16 questions across 5 categories — Getting Started, Store & Ranks, Fortnite, Community, Modpacks) with smooth Framer Motion reveals, a CSS grid-based expand/collapse (no layout jank), full keyboard access (`aria-expanded`/`aria-controls`), and `prefers-reduced-motion` support.
- **Internationalization**: English, Arabic, Spanish, French, German, Portuguese, Turkish, Japanese, Korean and Chinese, via a centralized `messages/*.json` dictionary per locale (126 matching keys each — verified structurally identical across all 10 files). Locale is resolved server-side from a cookie (`ZO7AL_LOCALE`, persists for a year), so `<html lang dir>` is correct on the very first byte — no flash of the wrong language or direction. Arabic is a first-class RTL experience: layout mirrors correctly, directional icons flip via Tailwind's `rtl:` variant, and numeric/technical strings (server IPs, prices, Fortnite codes) stay pinned LTR inside RTL text via targeted `dir="ltr"` spans.
  > Scope note: navigation, hero copy, section headers, the FAQ, footer and all common buttons/labels are fully localized. A few secondary, data-layer strings are intentionally left in English across locales — Minecraft version/mode descriptions, store rank perk bullets, and anything sourced live from an external API (Modrinth project descriptions, social platform blurbs, Fortnite map titles) — since the latter are real external content in their original language/form, not UI chrome, and "translating" them would mean fabricating text that isn't actually on the source page.
- Fully responsive, keyboard-navigable, with visible focus states and ARIA live status updates.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
messages/           Translation dictionaries, one JSON file per locale
src/
  app/               Route segments (/, /minecraft, /modpacks, /fortnite, /socials, /store)
  i18n/              next-intl config, locale list, request resolver
  components/
    cursor/          Custom cursor + magnetic button
    layout/          Navbar, Footer, page transitions, language switcher
    ui/              Shared building blocks (SectionHeader, Reveal, PageHero, BrandIcon)
    home/             Home page sections
    faq/              Premium FAQ section + accordion
    minecraft/        Server status, connect, versions, modes
    modpacks/          Modrinth + CurseForge galleries
    fortnite/          Map gallery
    socials/           Social grid
    store/             Rank cards
  lib/
    data/              Verified, non-fabricated static/fallback data sources
    sync/              Live-sync fetchers (Linktree, CurseForge, Fortnite) + shared scraping helpers
```

## Data sources

| Source | URL |
| --- | --- |
| Minecraft server | `zo7al.play-mc.fun` |
| Modrinth | https://modrinth.com/user/iiZo7al |
| CurseForge | https://www.curseforge.com/members/iizo7al/projects |
| Fortnite | https://www.fortnite.com/@zo7al |
| Linktree | https://linktr.ee/Zo7al |
| Store | https://zo7al.tebex.io/ |

## Build

```bash
npm run build
```

## License

All rights reserved — © 2026 Zo7al.
