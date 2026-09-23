type Translator = (key: string, values?: Record<string, string | number>) => string;

export function descriptionLines(description: string): string[] {
  return description.replace(/^[ \t]*[•●][ \t]*\n\s*/gm, "• ")
    .split(/\n+/).map(line => line.trim()).filter(Boolean);
}

const patterns: [RegExp, string, string[]][] = [
  [/^🪙 ([\d,]+) Coins – Zo7al Network$/, "coinsHeading", ["count"]],
  [/^By purchasing this package, you will receive ([\d,]+) Coins added directly to your Minecraft account\.$/, "coinsIntro", ["count"]],
  [/^By purchasing this package, you will receive ([\d,]+) Coins \+ (\d+)% Bonus added directly to your Minecraft account\.$/, "coinsBonusIntro", ["count", "bonus"]],
  [/^([\d,]+) Coins$/, "coinsAmount", ["count"]],
  [/^\+(\d+)% Bonus \(([\d,]+) Coins\)$/, "coinsBonus", ["bonus", "count"]],
  [/^Total: ([\d,]+) Coins$/, "coinsTotal", ["count"]],
  [/^Total Received: ([\d,]+) Coins\.$/, "coinsReceived", ["count"]],
  [/^Amount: ([\d,]+) Coins\.$/, "coinsQuantity", ["count"]],
  [/^(.+) Rank – Zo7al Network$/, "title", ["rank"]],
  [/^(.+) Upgrade – Zo7al Network$/, "upgrade", ["rank"]],
  [/^By purchasing this package, you will permanently receive the (.+) Rank with the following benefits:$/, "introPermanent", ["rank"]],
  [/^By purchasing this package, you will permanently receive the (.+) Rank, which includes all (.+) benefits plus:$/, "introInherited", ["rank", "inherits"]],
  [/^By purchasing this package, you will receive the (.+) Rank for one month, including all (.+) benefits plus:$/, "introMonthly", ["rank", "inherits"]],
  [/^Chat prefix: \[(.+)\]$/, "prefix", ["rank"]],
  [/^Exclusive chat prefix: \[(.+)\]$/, "exclusivePrefix", ["rank"]],
  [/^Exclusive (.+) chat color$/, "chatColor", ["rank"]],
  [/^Access to (?:command: )?(\/.+)$/, "command", ["command"]],
  [/^(\d+) sethomes \(\/sethome\)$/, "homes", ["count"]],
  [/^(.+) Discord role$/, "role", ["rank"]],
  [/^Access to (.+)-only Discord channels$/, "channels", ["rank"]],
  [/^Access to private (.+) Discord channels$/, "channels", ["rank"]],
];

// Only translate source phrases we know. Unrecognized live edits remain visible,
// rather than replacing them with a stale, hard-coded package description.
export function localizedDescription(description: string, translate: Translator): string[] {
  return descriptionLines(description).map(line => {
    const bullet = /^[•●]\s*/.test(line);
    const source = line.replace(/^[•●]\s*/, "");
    const fixed = sourcePhrases[source];
    let text = fixed ? translate(fixed) : source;
    if (!fixed) for (const [pattern, key, names] of patterns) {
      const match = source.match(pattern);
      if (!match) continue;
      const values = Object.fromEntries(names.map((name, i) => [name, match[i + 1]]));
      // This inherited-rank combination is present in the current MVP+ source.
      if (values.inherits === "VIP and MVP") values.inherits = translate("vipAndMvp");
      text = translate(key, values);
      break;
    }
    return (bullet ? "• " : "") + text;
  });
}

const sourcePhrases: Record<string, string> = {
  "🎁 Package Includes:": "coinsIncludes",
  "🪙 Package Includes:": "coinsIncludes",
  "Coins can be used in the Zo7al Network in-game store": "coinsUse",
  "Purchase available items, upgrades, and other server content using your Coins": "coinsPurchase",
  "Coins are linked to the Minecraft username entered at checkout": "coinsLinked",
  "Coins are delivered automatically within 1–5 minutes after payment.": "coinsDelivery",
  "If your Coins are not received within 10–15 minutes, please relog or contact support with your order ID.": "coinsDeliveryHelp",
  "By boosting the Zo7al Network Discord server with one or more Server Boosts, you will receive the Booster Rank with the following benefits:": "introBooster",
  "🎮 In-Game Benefits:": "game",
  "💬 Discord Benefits:": "discord",
  "📦 Delivery Information:": "delivery",
  "Basic in-game support priority": "supportBasic",
  "In-game support priority": "supportGame",
  "Higher in-game support priority": "supportHigherGame",
  "Highest in-game support priority": "supportHighestGame",
  "Special Discord name color": "nameColor",
  "Exclusive Discord name color": "exclusiveNameColor",
  "Higher support priority": "supportHigher",
  "Highest support priority": "supportHighest",
  "Exclusive supporter badge": "supporterBadge",
  "Access to exclusive announcements": "announcements",
  "Server join priority (if queue system is enabled)": "queue",
  "Rank is delivered automatically within 1–5 minutes after payment.": "deliverAuto",
  "Please enter your correct Minecraft username at checkout.": "username",
  "If not received within 10–15 minutes, please relog or contact support with your order ID.": "deliveryHelp",
  "Rank Duration: Permanent.": "permanent",
  "Payment Type: One-time purchase (non-recurring).": "once",
  "Rank Duration: 1 Month (30 Days).": "monthDuration",
  "Payment Type: Monthly recurring subscription.": "recurring",
  "The subscription renews automatically every month unless cancelled.": "renewal",
  "Boost the Zo7al Network Discord server with one or more Server Boosts.": "boost",
  "Once your boost is active, the Booster Rank will be granted automatically or after account verification.": "grantBoost",
  "Please make sure your Discord account is linked to the correct Minecraft account.": "linkAccounts",
  "If you do not receive the rank, please contact support.": "boostHelp",
  "Rank Duration: Active while at least one Discord Server Boost remains active.": "boostDuration",
  "Price: One or more Discord Server Boosts.": "boostPrice",
  "If all boosts expire or are removed, the Booster Rank and its benefits will also be removed.": "boostEnd",
  "🚀 In-Game Benefits:": "game"
};
