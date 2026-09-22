# Embedded Tebex checkout

The store uses the Tebex Headless API for its live catalog and baskets, then Tebex.js renders checkout inside the store dialog on desktop and mobile. Payment details are handled by Tebex; the site never receives card details or marks orders as paid.

## Activate on Vercel

1. Open your **Zo7al Minecraft store** in [Tebex Creator](https://creator.tebex.io/developers/api-keys). Under **Developers → API Keys**, copy the **Headless API Public Token**. Also copy the **Private Key** from the same Headless API credentials. Do not use the Minecraft plugin secret or a webhook signing secret.
2. In Vercel, open **zo7al-website → Settings → Environment Variables**. Add `TEBEX_PUBLIC_TOKEN` and `TEBEX_PRIVATE_KEY` to Production and any Preview environments where you want to test. Enter the private key directly in Vercel; never send it in chat, commit it, or prefix it with `NEXT_PUBLIC_`.
3. Redeploy the website after merging this change. Confirm `/store` displays the current products and prices from your own Tebex store.
4. In Tebex, confirm your Minecraft integration, packages and delivery commands are configured. Install/configure the Tebex server plugin as required by your store. The website does not grant ranks itself.
5. Use Tebex's supported test-payment flow to check a real Minecraft username, basket contents, payment completion, cancellation and delivery on your server. Repeat on desktop and iPhone/Android. No real payment has been verified by this code change.

Public catalog reads use only the public token. Server-side basket creation with the visitor `ip_address` requires HTTP Basic authentication: public token as username, private key as password. The server adds this header only to the authenticated Tebex request. The private key stays server-side.

The original implementation incorrectly treated basket creation as public. Live Tebex returned HTTP 422 with `Basic auth credentials are required`; this was the cause of checkout returning HTTP 502. Missing credentials now return HTTP 503 with `CONFIGURATION`. After adding the private key, redeploy before testing. A successful catalog read does not verify payment readiness.

## Behavior and scope

- Without the token, or if Tebex cannot be reached, rank previews remain visible and purchase buttons are disabled. No stale prices are presented as current prices.
- The server verifies the requested package against the live catalog. Only package ID and quantity are sent; Tebex determines prices, taxes and delivery.
- Checkout uses `Tebex.checkout.render(element, width, height, false)` to retain the embedded view on mobile. A bank, wallet or 3-D Secure flow may still require its own authentication window.
- This integration targets ordinary Minecraft username-based packages. Dynamic categories, custom package variables, gift cards and packages requiring external account authorization need a dedicated purchase flow before being offered here.
- The deployment must supply a trustworthy `x-forwarded-for` visitor IP (as Vercel does). Do not expose this handler behind a proxy that passes arbitrary client-supplied forwarding headers unchanged.
- The per-instance rate limit is a basic abuse guard, not a distributed limiter. Apply hosting-level rate limits if needed.
- New or renamed products come from Tebex. The three existing rank descriptions use the site's ten translations; any new product description is supplied by Tebex and should be localized in your store/content workflow.

References: [Headless API authorization](https://docs.tebex.io/developers/headless-api/authorization), [Tebex.js](https://docs.tebex.io/developers/tebex.js/overview), [official Node SDK](https://github.com/tebexio/tebex-sdk-nodejs).

## Live catalog and ownership

The store reads names, prices, descriptions, images, package order and newly added packages directly from Tebex. Open pages refresh every 60 seconds and when returning to the tab. No local rank list controls the store cards. A temporary refresh failure retains the last successful catalog; checkout always revalidates with Tebex.

To display **Owned** reliably, add `TEBEX_PLUGIN_SECRET` to Vercel for this project's Production and Preview environments, then redeploy. Obtain the game-server secret from https://creator.tebex.io/game-servers → Edit. This is distinct from the Headless private key. Never put it in browser code or paste it into a public issue. The server checks active packages for the username ID returned by Tebex and exposes only the ownership outcome, not purchase records.

Without this optional secret, checkout still works but a generic Tebex purchase restriction cannot be called ownership. The UI explains that the rank may already be owned or subject to another restriction. With the secret configured, confirmed active ownership returns `ALREADY_OWNED` before adding the package. API failures never fabricate an owned state.

Live diagnosis: VIP and MVP+ were rejected for iiZo7al with `The product isn't purchasable`; MVP succeeded. VIP and MVP+ were accepted for a different valid username. Every current rank has a lifetime user limit of 1; ownership was not independently verified without the game-server secret. No payments were made.

## Payment success message

The embedded `payment:complete` event triggers a server-side basket-status check; the event or `?checkout=complete` URL flag alone never marks payment successful. The page displays its celebration only when Tebex returns the matching basket with `complete: true`. Session storage preserves the basket across a checkout return. Delayed confirmation is retried for a bounded period and displayed as pending, not successful. This is presentation only: Tebex continues handling fulfillment; no items are granted from browser events.
