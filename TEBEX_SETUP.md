# Embedded Tebex checkout

The store uses the Tebex Headless API for its live catalog and baskets, then Tebex.js renders checkout inside the store dialog on desktop and mobile. Payment details are handled by Tebex; the site never receives card details or marks orders as paid.

## Activate on Vercel

1. Open your **Zo7al Minecraft store** in [Tebex Creator](https://creator.tebex.io/developers/api-keys). Under **Developers → API Keys**, copy the **Headless API Public Token**. Do not use a plugin secret, private key or Checkout API secret.
2. In Vercel, open **zo7al-website → Settings → Environment Variables**. Add `TEBEX_PUBLIC_TOKEN` with that token to Production and any Preview environments where you want to test.
3. Redeploy the website after merging this change. Confirm `/store` displays the current products and prices from your own Tebex store.
4. In Tebex, confirm your Minecraft integration, packages and delivery commands are configured. Install/configure the Tebex server plugin as required by your store. The website does not grant ranks itself.
5. Use Tebex's supported test-payment flow to check a real Minecraft username, basket contents, payment completion, cancellation and delivery on your server. Repeat on desktop and iPhone/Android. No real payment has been verified by this code change.

No private Tebex key is required for the public Headless endpoints used here. Keep any unrelated private keys in server environment settings, never in browser code or messages.

## Behavior and scope

- Without the token, or if Tebex cannot be reached, rank previews remain visible and purchase buttons are disabled. No stale prices are presented as current prices.
- The server verifies the requested package against the live catalog. Only package ID and quantity are sent; Tebex determines prices, taxes and delivery.
- Checkout uses `Tebex.checkout.render(element, width, height, false)` to retain the embedded view on mobile. A bank, wallet or 3-D Secure flow may still require its own authentication window.
- This integration targets ordinary Minecraft username-based packages. Dynamic categories, custom package variables, gift cards and packages requiring external account authorization need a dedicated purchase flow before being offered here.
- The deployment must supply a trustworthy `x-forwarded-for` visitor IP (as Vercel does). Do not expose this handler behind a proxy that passes arbitrary client-supplied forwarding headers unchanged.
- The per-instance rate limit is a basic abuse guard, not a distributed limiter. Apply hosting-level rate limits if needed.
- New or renamed products come from Tebex. The three existing rank descriptions use the site's ten translations; any new product description is supplied by Tebex and should be localized in your store/content workflow.

References: [Headless API](https://docs.tebex.io/developers/headless-api/overview), [Tebex.js](https://docs.tebex.io/developers/tebex.js/overview), [official Node SDK](https://github.com/tebexio/tebex-sdk-nodejs).
