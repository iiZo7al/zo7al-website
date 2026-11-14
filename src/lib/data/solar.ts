export type SolarRole =
  | "admin"
  | "creator"
  | "streamer"
  | "writer"
  | "editor"
  | "designer"
  | "player";

export type SolarAdminSubType =
  | "president" // الرئيس
  | "vice_president" // نائب الرئيس
  | "exec_supervisor" // مشرف تنفيذي
  | "dept_supervisor" // مشرف أقسام
  | "general_admin" // إدارة عامة
  | "admin_monitor" // مراقب إدارة
  | "creators_supervisor" // مشرف صناع محتوى
  | "creators_admin" // إداري صناع محتوى
  | "designers_supervisor" // مشرف مصممين
  | "players_supervisor" // مشرف لاعبين
  | "players_admin" // إداري لاعبين
  | "editors_supervisor" // مشرف ممنتجين
  | "streamers_supervisor"; // مشرف ستريمرز

export type SolarGame = "fortnite" | "rocket" | "minecraft" | "fifa";

export const SOLAR_CONTRACT_DURATIONS: { id: string; label: string }[] = [
  { id: "2_months", label: "شهرين" },
  { id: "3_months", label: "ثلاثة شهور" },
  { id: "4_months", label: "اربع شهور" },
  { id: "5_months", label: "خمسة شهور" },
  { id: "6_months", label: "ستة شهور" },
  { id: "1_year", label: "سنة" },
  { id: "2_years", label: "سنتين" },
  { id: "other", label: "أخرى" },
];

export type SolarApplicationInput = {
  name: string; // اسمك؟
  nickname?: string; // لقبك؟
  age?: number | string; // عمرك؟
  country?: string; // من وين؟
  discord: string; // حسابك ديسكورد؟ (اليوزر)
  whatsapp: string; // رقم جوالك؟ (للتواصل)
  role: SolarRole; // وش تقدم؟
  adminSubType?: SolarAdminSubType;
  game?: SolarGame;
  channelUrl?: string; // رابط قناتك
  streamUrl?: string; // رابط البث
  portfolioUrl?: string; // رابط أعمالك
  experienceDuration?: string; // كم مدة خبرتك في الي بتقدم فيه؟
  hasPreviousClans?: boolean; // هل عندك خبرة سابقة في الكلانات؟
  contractDuration?: string; // مدة العقد
  contractDurationCustom?: string;
  signedContractUrl?: string; // رابط صورة العقد الموقعة
  signatureDataUrl?: string; // أو التوقيع الرقمي
  pledgeAgreed?: boolean; // موافق على التعهد
  whyJoin?: string; // لماذا ترغب بالانضمام إلى Solar System؟
  bio: string; // نبذة عامة
};

export const SOLAR_SOCIALS = [
  {
    id: "linktree",
    name: "Linktree",
    title: "Linktree",
    url: "https://linktr.ee/SolarSystemTeam",
    icon: "link",
    badge: "روابط الكلان الرسمية",
  },
  {
    id: "youtube",
    name: "YouTube",
    title: "YouTube",
    url: "https://www.youtube.com/@SolarSystemTeam",
    icon: "youtube",
    badge: "قناة الكلان الرسمية",
  },
  {
    id: "x",
    name: "X",
    title: "X",
    url: "https://x.com/SolarSystemTeam",
    icon: "x",
    badge: "أحدث الأخبار والإعلانات",
  },
  {
    id: "tiktok",
    name: "TikTok",
    title: "TikTok",
    url: "https://www.tiktok.com/@solarsystamteam",
    icon: "tiktok",
    badge: "المقاطع واللقطات القصيرة",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    title: "WhatsApp",
    url: "https://whatsapp.com/channel/0029Vb9b1rSAYlUQEms6gG37",
    icon: "whatsapp",
    badge: "قناة التحديثات المباشرة",
  },
  {
    id: "threads",
    name: "Threads",
    title: "Threads",
    url: "https://www.threads.com/@solarsystemteam",
    icon: "threads",
    badge: "المنشورات والنقاشات",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    title: "Snapchat",
    url: "https://www.snapchat.com/@solarsystemteam",
    icon: "snapchat",
    badge: "يوميات وكواليس الكلان",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    title: "Bluesky",
    url: "https://bsky.app/profile/solarsystemteam.bsky.social",
    icon: "bluesky",
    badge: "تحديثات المجتمع",
  },
];

export const SOLAR_CLAN_MAP = {
  id: "clan-wars",
  title: "حرب الكلانات زحل Zo7al 🚀💥",
  code: "6387-4453-1682",
  category: "Clan Wars",
  thumbnail: "/assets/site/solar-clan-map.png",
  url: "https://www.fortnite.com/@zo7al/6387-4453-1682?lang=ar",
  description:
    "🧡🌹 اضغط إعجاب وأضف الماب للمفضلة لدعمي 🏆 معركة بين 4 فرق 🔫 اختر أسلحتك المفضلة ✏️ طوّر مهاراتك في البناء 📝 تدرّب وطوّر مهاراتك ✨ نظام رتب 🤩 متعة وعناصر بلا نهاية 💪 تدرّب على التصويب 💥 أكشن سريع 🌀 زون وورز الكلاسيكي 😎 مصنوع باستخدام UEFN",
  tags: ["Clan Wars", "4 Teams", "Ranked", "Fast Action", "Zone Wars", "UEFN"],
};

export const SOLAR_LEADERSHIP = [
  {
    name: "زحل Zo7al",
    role: "مؤسس وقائد الكلان (Founder & Leader)",
    tag: "Leader",
    avatar: "/assets/site/server-logo.png",
    bio: "صانع محتوى ومؤسس شبكة وكلان Solar System Team.",
  },
  {
    name: "الإدارة العامة (General Management)",
    role: "الإشراف والتنسيق العام للكلان",
    tag: "Admin",
    bio: "تنظيم الأقسام، متابعة الأعضاء، والإشراف على الفعاليات والبطولات.",
  },
  {
    name: "صناع المحتوى والستريمرز (Creators & Streamers)",
    role: "نخبة مبدعي الكلان",
    tag: "Creators",
    bio: "بثوث مباشرة، فيديوهات يوتيوب، ولقطات احترافية يومية.",
  },
  {
    name: "الفريق التنافسي (Competitive Squad)",
    role: "أبطال فورتنايت، روكيت، فيفا وماينكرافت",
    tag: "Pro Players",
    bio: "تمثيل الكلان في البطولات والسكرمز والمنافسات التنافسية.",
  },
];

export function validateSolarApplication(
  value: unknown,
): SolarApplicationInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const nickname =
    typeof input.nickname === "string" && input.nickname.trim()
      ? input.nickname.trim()
      : name;
  const age =
    typeof input.age === "number" || typeof input.age === "string"
      ? String(input.age).trim()
      : "";
  const country =
    typeof input.country === "string" ? input.country.trim() : "";
  const discord = typeof input.discord === "string" ? input.discord.trim() : "";
  const whatsapp =
    typeof input.whatsapp === "string" ? input.whatsapp.trim() : "";
  const whyJoin =
    typeof input.whyJoin === "string"
      ? input.whyJoin.trim()
      : typeof input.bio === "string"
        ? input.bio.trim()
        : "";
  const bio = whyJoin;
  const role = input.role as SolarRole;

  if (
    !name ||
    name.length < 2 ||
    name.length > 80 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(name)
  )
    return null;
  if (
    !discord ||
    discord.length < 2 ||
    discord.length > 50 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(discord)
  )
    return null;
  if (
    !whatsapp ||
    whatsapp.length < 6 ||
    whatsapp.length > 30 ||
    !/^[+0-9\s-]{6,30}$/.test(whatsapp)
  )
    return null;
  if (
    !bio ||
    bio.length < 2 ||
    bio.length > 2500 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(bio)
  )
    return null;

  const validRoles: SolarRole[] = [
    "admin",
    "creator",
    "streamer",
    "writer",
    "editor",
    "designer",
    "player",
  ];
  if (!validRoles.includes(role)) return null;

  let adminSubType: SolarAdminSubType | undefined;
  let game: SolarGame | undefined;
  let channelUrl: string | undefined;
  let streamUrl: string | undefined;
  let portfolioUrl: string | undefined;

  if (role === "admin") {
    const validSubTypes: SolarAdminSubType[] = [
      "president",
      "vice_president",
      "exec_supervisor",
      "dept_supervisor",
      "general_admin",
      "admin_monitor",
      "creators_supervisor",
      "creators_admin",
      "designers_supervisor",
      "players_supervisor",
      "players_admin",
      "editors_supervisor",
      "streamers_supervisor",
    ];
    if (
      input.adminSubType &&
      validSubTypes.includes(input.adminSubType as unknown as SolarAdminSubType)
    ) {
      adminSubType = input.adminSubType as SolarAdminSubType;
      if (
        adminSubType === "players_supervisor" ||
        adminSubType === "players_admin"
      ) {
        const validGames: SolarGame[] = [
          "fortnite",
          "rocket",
          "fifa",
          "minecraft",
        ];
        if (validGames.includes(input.game as unknown as SolarGame)) {
          game = input.game as SolarGame;
        } else {
          game = "fortnite";
        }
      }
    }
  } else if (role === "player") {
    const validGames: SolarGame[] = [
      "fortnite",
      "rocket",
      "minecraft",
      "fifa",
    ];
    if (validGames.includes(input.game as unknown as SolarGame)) {
      game = input.game as SolarGame;
    } else {
      game = "fortnite";
    }
  } else if (role === "creator") {
    if (typeof input.channelUrl === "string" && input.channelUrl.trim()) {
      try {
        const u = new URL(input.channelUrl.trim());
        if (u.protocol === "https:" || u.protocol === "http:") {
          channelUrl = u.href;
        }
      } catch {
        /* optional */
      }
    }
  } else if (role === "streamer") {
    if (typeof input.streamUrl === "string" && input.streamUrl.trim()) {
      try {
        const u = new URL(input.streamUrl.trim());
        if (
          u.protocol === "https:" &&
          /^(www\.)?(tiktok\.com|twitch\.tv|kick\.com)$/i.test(u.hostname)
        ) {
          streamUrl = u.href;
        }
      } catch {
        /* optional */
      }
    }
  } else if (role === "editor" || role === "designer" || role === "writer") {
    if (typeof input.portfolioUrl === "string" && input.portfolioUrl.trim()) {
      try {
        const u = new URL(input.portfolioUrl.trim());
        if (u.protocol === "https:") portfolioUrl = u.href;
      } catch {
        /* optional */
      }
    }
  }

  const experienceDuration =
    typeof input.experienceDuration === "string"
      ? input.experienceDuration.trim().slice(0, 200)
      : "";
  const hasPreviousClans =
    typeof input.hasPreviousClans === "boolean"
      ? input.hasPreviousClans
      : input.hasPreviousClans === "نعم" || input.hasPreviousClans === "true";
  const contractDuration =
    typeof input.contractDuration === "string"
      ? input.contractDuration.trim().slice(0, 100)
      : "3_months";
  const contractDurationCustom =
    typeof input.contractDurationCustom === "string"
      ? input.contractDurationCustom.trim().slice(0, 100)
      : undefined;

  let signedContractUrl: string | undefined;
  if (
    typeof input.signedContractUrl === "string" &&
    input.signedContractUrl.trim()
  ) {
    const trimmed = input.signedContractUrl.trim();
    if (
      trimmed.startsWith("/api/solar/media/") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:image/")
    ) {
      signedContractUrl = trimmed.slice(0, 4000);
    }
  }
  if (!signedContractUrl) return null;

  const pledgeAgreed =
    input.pledgeAgreed === true ||
    input.pledgeAgreed === "موافق" ||
    input.pledgeAgreed === "true";

  return {
    name,
    nickname: nickname || undefined,
    age: age || undefined,
    country: country || undefined,
    discord,
    whatsapp,
    role,
    ...(adminSubType ? { adminSubType } : {}),
    ...(game ? { game } : {}),
    ...(channelUrl ? { channelUrl } : {}),
    ...(streamUrl ? { streamUrl } : {}),
    ...(portfolioUrl ? { portfolioUrl } : {}),
    experienceDuration: experienceDuration || undefined,
    hasPreviousClans,
    contractDuration,
    ...(contractDurationCustom ? { contractDurationCustom } : {}),
    ...(signedContractUrl ? { signedContractUrl } : {}),
    pledgeAgreed,
    whyJoin,
    bio,
  };
}
