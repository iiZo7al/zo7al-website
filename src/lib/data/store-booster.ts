import type { StoreProduct } from "../server/tebex";

// A Discord offer, kept outside the Tebex checkout catalog.
export const BOOSTER_PRODUCT: StoreProduct = {
  id: -1, name: "Booster", price: 4.99, currency: "USD", image: "/assets/site/booster.png", available: true,
  description: `Booster Rank – Zo7al Network
By boosting the Zo7al Network Discord server with one or more Server Boosts, you will receive the Booster Rank with the following benefits:

🎮 In-Game Benefits:
• Chat prefix: [BOOSTER]
• Exclusive Booster chat color
• Access to command: /kit booster
• 4 sethomes (/sethome)
• Access to /hat
• Access to /craft
• In-game support priority

💬 Discord Benefits:
• Booster Discord role
• Access to Booster-only Discord channels
• Special Discord name color
• Exclusive supporter badge
• Higher support priority

📦 Delivery Information:
• Boost the Zo7al Network Discord server with one or more Server Boosts.
• Once your boost is active, the Booster Rank will be granted automatically or after account verification.
• Please make sure your Discord account is linked to the correct Minecraft account.
• If you do not receive the rank, please contact support.

Rank Duration: Active while at least one Discord Server Boost remains active.
Price: One or more Discord Server Boosts.
If all boosts expire or are removed, the Booster Rank and its benefits will also be removed.`,
};

// Follow the explicit billing terms in the live Tebex description.
export function isMonthlyRank(product: StoreProduct) {
  return /monthly recurring subscription|اشتراك شهري/i.test(product.description);
}
