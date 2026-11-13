export type EasterEggRarity = "common" | "rare" | "epic" | "legendary";

export type EasterEggId =
  | "saturn_nova"
  | "creeper_boom"
  | "diamond_ore"
  | "night_owl"
  | "solar_eclipse"
  | "footer_relic"
  | "konami_code"
  | "master_collector";

export interface EasterEggDefinition {
  id: EasterEggId;
  rarity: EasterEggRarity;
  titleAr: string;
  titleEn: string;
  hintAr: string;
  hintEn: string;
  secretAr: string;
  secretEn: string;
  locationAr: string;
  locationEn: string;
}

export const EASTER_EGGS: EasterEggDefinition[] = [
  {
    id: "saturn_nova",
    rarity: "rare",
    titleAr: "انفجار زحل",
    titleEn: "Saturn Supernova",
    hintAr: "اقترب من كوكب زحل في الصفحة الرئيسية واضغط عليه حتى ينفجر.",
    hintEn: "Interact with the 3D Saturn planet on the homepage until it bursts.",
    secretAr: "كسرت حلقات زحل وأطلقت موجة كونية في الفضاء!",
    secretEn: "You shattered Saturn's rings and unleashed a cosmic shockwave!",
    locationAr: "الصفحة الرئيسية",
    locationEn: "Homepage",
  },
  {
    id: "creeper_boom",
    rarity: "rare",
    titleAr: "هسس... بوم!",
    titleEn: "Hiss... Boom!",
    hintAr: "شيء أخضر يختبئ خلف آلة الكتابة في الصفحة الرئيسية... اكتب اسمه واضغط Enter.",
    hintEn: "Something green lurks behind the homepage typewriter... type its name and press Enter.",
    secretAr: "نجوت من انفجار الكريبر في اللحظة الأخيرة!",
    secretEn: "You survived a Creeper ambush just in time!",
    locationAr: "آلة الكتابة — الرئيسية",
    locationEn: "Homepage Typewriter",
  },
  {
    id: "diamond_ore",
    rarity: "rare",
    titleAr: "ألماس نادر",
    titleEn: "Rare Diamond",
    hintAr: "أثمن معدن في ماينكرافت... جرب كتابته في آلة الكتابة بالصفحة الرئيسية.",
    hintEn: "Minecraft's most precious gem... try typing it in the homepage typewriter.",
    secretAr: "عثرت على عرق ألماس نقي في أعماق السيرفر!",
    secretEn: "You struck a pure diamond vein deep underground!",
    locationAr: "آلة الكتابة — الرئيسية",
    locationEn: "Homepage Typewriter",
  },
  {
    id: "night_owl",
    rarity: "epic",
    titleAr: "نبض زحل",
    titleEn: "Zo7al Pulse",
    hintAr: "اكتب اسمنا السري في آلة الكتابة بالصفحة الرئيسية، أو استكشف لوحة المفاتيح.",
    hintEn: "Type our signature name in the homepage typewriter.",
    secretAr: "تواصلت مباشرة مع نواة مشاريع زحل!",
    secretEn: "You tuned directly into the Zo7al Projects core!",
    locationAr: "في أي مكان",
    locationEn: "Anywhere",
  },
  {
    id: "solar_eclipse",
    rarity: "epic",
    titleAr: "كسوف الشمس",
    titleEn: "Solar Eclipse",
    hintAr: "شعار كلان سولار ثلاثي الأبعاد في صفحة /solar يخفي طاقة عند لمسه عدة مرات.",
    hintEn: "The 3D Solar Clan logo on /solar hides energy when tapped repeatedly.",
    secretAr: "أيقظت طاقة الكسوف داخل شعار كلان Solar!",
    secretEn: "You awakened the eclipse energy inside the Solar Clan emblem!",
    locationAr: "صفحة كلان Solar",
    locationEn: "Solar Page",
  },
  {
    id: "footer_relic",
    rarity: "epic",
    titleAr: "أثر التذييل",
    titleEn: "Footer Relic",
    hintAr: "في أسفل كل صفحة يوجد شعار Zo7al... جرب النقر عليه 5 مرات متتالية.",
    hintEn: "At the bottom of every page sits the Zo7al brand mark... tap it 5 times.",
    secretAr: "اكتشفت البصمة السرية المدفونة في أسفل الموقع!",
    secretEn: "You uncovered the secret signature buried at the bottom of the site!",
    locationAr: "تذييل الموقع",
    locationEn: "Site Footer",
  },
  {
    id: "konami_code",
    rarity: "legendary",
    titleAr: "شيفرة الأساطير",
    titleEn: "The Konami Code",
    hintAr: "أشهر شيفرة ألعاب في التاريخ: ↑ ↑ ↓ ↓ ← → ← → B A في أي صفحة.",
    hintEn: "The most iconic cheat code in gaming history: ↑ ↑ ↓ ↓ ← → ← → B A anywhere.",
    secretAr: "فتحت شيفرة اللاعبين الأسطورية بنجاح!",
    secretEn: "You unlocked the legendary gamer sequence!",
    locationAr: "في أي صفحة",
    locationEn: "Any Page",
  },
  {
    id: "master_collector",
    rarity: "legendary",
    titleAr: "صائد الأسرار",
    titleEn: "Master of Secrets",
    hintAr: "اجمع جميع الأسرار الـ 7 الأخرى في الموقع لفتح هذا اللقب الأسطوري.",
    hintEn: "Discover all 7 other secrets across the site to unlock this legendary badge.",
    secretAr: "أتممت جميع الأسرار المخفية وأصبحت أسطورة استكشاف زحل!",
    secretEn: "You uncovered every hidden secret and became a Zo7al exploration legend!",
    locationAr: "أرشيف الأسرار",
    locationEn: "Secret Vault",
  },
];

const EASTER_EGG_KEY = "zo7al-easter-eggs-v2";
const LEGACY_KEY = "zo7al-easter-eggs-found";
export const EASTER_EGG_CHANGE_EVENT = "zo7al:easter-eggs-change";
export const EASTER_EGG_DISCOVERED_EVENT = "zo7al:easter-egg-discovered";

const VALID_IDS = new Set<string>(EASTER_EGGS.map((e) => e.id));

export function getDiscoveredEasterEggs(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EASTER_EGG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const clean: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (VALID_IDS.has(k) && typeof v === "string") {
            clean[k] = v;
          }
        }
        return clean;
      }
    }

    // Migrate legacy v1 discoveries if present
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated: Record<string, string> = {};
      const now = new Date().toISOString();
      if (legacy === "first") {
        migrated.saturn_nova = now;
      } else {
        const arr = JSON.parse(legacy) as unknown;
        if (Array.isArray(arr)) {
          if (arr.includes("saturn")) migrated.saturn_nova = now;
          if (arr.includes("creeper")) migrated.creeper_boom = now;
        }
      }
      if (Object.keys(migrated).length > 0) {
        window.localStorage.setItem(EASTER_EGG_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
    return {};
  } catch {
    return {};
  }
}

export function discoverEasterEgg(id: EasterEggId): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getDiscoveredEasterEggs();
    if (current[id]) return false;

    const now = new Date().toISOString();
    const next: Record<string, string> = { ...current, [id]: now };

    const nonMasterIds = EASTER_EGGS.filter((e) => e.id !== "master_collector").map(
      (e) => e.id,
    );
    const unlockedMaster =
      !next.master_collector && nonMasterIds.every((reqId) => Boolean(next[reqId]));
    if (unlockedMaster) {
      next.master_collector = now;
    }

    window.localStorage.setItem(EASTER_EGG_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EASTER_EGG_CHANGE_EVENT));
    window.dispatchEvent(
      new CustomEvent(EASTER_EGG_DISCOVERED_EVENT, {
        detail: { id: unlockedMaster ? "master_collector" : id, alsoUnlocked: id },
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function resetEasterEggs(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(EASTER_EGG_KEY);
    window.localStorage.removeItem(LEGACY_KEY);
    window.dispatchEvent(new Event(EASTER_EGG_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function hasAnyEasterEgg(): boolean {
  return Object.keys(getDiscoveredEasterEggs()).length > 0;
}

export const hasFoundFirstEasterEgg = hasAnyEasterEgg;
export const discoverFirstEasterEgg = () => discoverEasterEgg("saturn_nova");
export const hasFoundCreeperEasterEgg = () =>
  Boolean(getDiscoveredEasterEggs().creeper_boom);
export const discoverCreeperEasterEgg = () => discoverEasterEgg("creeper_boom");
