import type { StoreProduct } from "../server/tebex";

// A Discord offer, kept outside the Tebex checkout catalog.
export const BOOSTER_PRODUCT: StoreProduct = {
  id: -1, name: "Booster", price: 4.99, currency: "USD", image: "/assets/site/booster.png", available: true,
  description: `باقة Booster – Zo7al Network
عند دعم سيرفر Zo7al Network ببوست واحد أو أكثر على Discord ستحصل على رتبة Booster مع المميزات التالية:

🎮 مميزات داخل السيرفر:
• برفكس في الشات: [BOOSTER]
• لون شات مخصص لرتبة Booster
• أمر /kit booster
• عدد 4 هومات (/sethome)
• أمر /hat
• أمر /craft
• أولوية دعم داخل السيرفر

💬 مميزات الديسكورد:
• رتبة Booster في Discord
• دخول قنوات Booster الخاصة
• لون اسم مميز في الديسكورد
• شارة مميزة للداعمين
• أولوية أعلى في الدعم

📦 طريقة الاستلام:
• قم بعمل Server Boost واحد أو أكثر لسيرفر Zo7al Network على Discord.
• بعد تفعيل البوست، يتم منح رتبة Booster تلقائياً أو بعد التحقق من حسابك.
• يجب ربط حساب Discord بحساب Minecraft الصحيح.
• في حال عدم استلام الرتبة، يرجى التواصل مع الدعم.

مدة الرتبة: تستمر طوال مدة بقاء بوست واحد على الأقل فعالاً.
السعر: Discord Server Boost واحد أو أكثر.
عند انتهاء أو إزالة جميع البوستات، يتم إزالة رتبة Booster ومميزاتها.

Booster Rank – Zo7al Network
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
