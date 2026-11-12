export type SolarRole =
  | "admin"
  | "creator"
  | "streamer"
  | "writer"
  | "editor"
  | "designer";

export type SolarAdminSubType =
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

export type SolarApplicationInput = {
  name: string; // الاسم واللقب
  discord: string; // حساب الديسكورد
  whatsapp: string; // رقم هاتف الواتساب
  bio: string; // نبذة وخبرات سابقة وسبب الانضمام
  role: SolarRole;
  adminSubType?: SolarAdminSubType;
  game?: SolarGame;
  channelUrl?: string; // لليوتيوب
  streamUrl?: string; // لتيك توك، تويتش، كيك
  portfolioUrl?: string; // للمصمم والممنتج وكاتب الأفكار
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
  {
    id: "fortnite",
    name: "Fortnite",
    title: "Fortnite",
    url: "https://www.fortnite.com/@zo7al",
    icon: "fortnite",
    badge: "كل أكواد الجزر في صفحة واحدة",
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
  const discord = typeof input.discord === "string" ? input.discord.trim() : "";
  const whatsapp =
    typeof input.whatsapp === "string" ? input.whatsapp.trim() : "";
  const bio = typeof input.bio === "string" ? input.bio.trim() : "";
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
    bio.length < 10 ||
    bio.length > 2000 ||
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
  ];
  if (!validRoles.includes(role)) return null;

  let adminSubType: SolarAdminSubType | undefined;
  let game: SolarGame | undefined;
  let channelUrl: string | undefined;
  let streamUrl: string | undefined;
  let portfolioUrl: string | undefined;

  if (role === "admin") {
    const validSubTypes: SolarAdminSubType[] = [
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
      !validSubTypes.includes(
        input.adminSubType as unknown as SolarAdminSubType,
      )
    )
      return null;
    adminSubType = input.adminSubType as SolarAdminSubType;

    if (
      adminSubType === "players_supervisor" ||
      adminSubType === "players_admin"
    ) {
      const validGames: SolarGame[] = [
        "fortnite",
        "rocket",
        "minecraft",
        "fifa",
      ];
      if (!validGames.includes(input.game as unknown as SolarGame)) return null;
      game = input.game as SolarGame;
    }
  } else if (role === "creator") {
    if (typeof input.channelUrl !== "string" || !input.channelUrl.trim())
      return null;
    try {
      const u = new URL(input.channelUrl.trim());
      if (
        u.protocol !== "https:" ||
        !/^(www\.)?(youtube\.com|youtu\.be)$/i.test(u.hostname)
      )
        return null;
      channelUrl = u.href;
    } catch {
      return null;
    }
  } else if (role === "streamer") {
    if (typeof input.streamUrl !== "string" || !input.streamUrl.trim())
      return null;
    try {
      const u = new URL(input.streamUrl.trim());
      if (
        u.protocol !== "https:" ||
        !/^(www\.)?(tiktok\.com|twitch\.tv|kick\.com)$/i.test(u.hostname)
      )
        return null;
      streamUrl = u.href;
    } catch {
      return null;
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

  return {
    name,
    discord,
    whatsapp,
    bio,
    role,
    ...(adminSubType ? { adminSubType } : {}),
    ...(game ? { game } : {}),
    ...(channelUrl ? { channelUrl } : {}),
    ...(streamUrl ? { streamUrl } : {}),
    ...(portfolioUrl ? { portfolioUrl } : {}),
  };
}
