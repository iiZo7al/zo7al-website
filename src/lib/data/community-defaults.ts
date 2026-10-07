import { DEFAULT_ACHIEVEMENTS, type CommunityEntry } from "./community";

const translations: Record<string, { title: string; body: string; options: string[]; goals: string[] }> = {
  en: { title: "What should Zo7al focus on next?", body: "Choose the update you would most like to see. Your vote helps guide future projects.", options: ["Minecraft game modes", "Fortnite islands", "Modpacks", "Community events"], goals: ["Play for 10 hours", "Play for 100 hours", "Reach a 5-day streak", "Reach a 20-day streak", "Get 100 kills", "Win 25 games"] },
  ar: { title: "وش تبغى نركز عليه في تحديثات زحل القادمة؟", body: "اختر التحديث اللي يهمك أكثر. صوتك يساعدنا نحدد أولويات المشاريع القادمة.", options: ["أطوار ماينكرافت", "مابات فورتنايت", "المودباكات", "فعاليات المجتمع"], goals: ["العب 10 ساعات", "العب 100 ساعة", "وصل ستريك 5 أيام", "وصل ستريك 20 يومًا", "حقق 100 قتلة", "فز في 25 مباراة"] },
  es: { title: "¿En qué debería centrarse Zo7al?", body: "Elige la actualización que más te gustaría ver. Tu voto ayuda a decidir las prioridades.", options: ["Modos de Minecraft", "Islas de Fortnite", "Modpacks", "Eventos de la comunidad"], goals: ["Juega 10 horas", "Juega 100 horas", "Alcanza una racha de 5 días", "Alcanza una racha de 20 días", "Consigue 100 bajas", "Gana 25 partidas"] },
  fr: { title: "Sur quoi Zo7al devrait-il se concentrer ?", body: "Choisissez la mise à jour que vous souhaitez le plus. Votre vote aide à définir les priorités.", options: ["Modes Minecraft", "Îles Fortnite", "Modpacks", "Événements communautaires"], goals: ["Jouer 10 heures", "Jouer 100 heures", "Atteindre une série de 5 jours", "Atteindre une série de 20 jours", "Obtenir 100 éliminations", "Gagner 25 parties"] },
  de: { title: "Worauf sollte Zo7al sich als Nächstes konzentrieren?", body: "Wähle dein Wunschupdate. Deine Stimme hilft bei der Planung der nächsten Projekte.", options: ["Minecraft-Spielmodi", "Fortnite-Inseln", "Modpacks", "Community-Veranstaltungen"], goals: ["10 Stunden spielen", "100 Stunden spielen", "Eine Serie von 5 Tagen erreichen", "Eine Serie von 20 Tagen erreichen", "100 Kills erzielen", "25 Spiele gewinnen"] },
  pt: { title: "Qual deve ser a próxima prioridade de Zo7al?", body: "Escolha a atualização que mais quer ver. Seu voto ajuda a definir as prioridades.", options: ["Modos de Minecraft", "Ilhas de Fortnite", "Modpacks", "Eventos da comunidade"], goals: ["Jogue 10 horas", "Jogue 100 horas", "Alcance uma sequência de 5 dias", "Alcance uma sequência de 20 dias", "Consiga 100 eliminações", "Vença 25 partidas"] },
  tr: { title: "Zo7al sırada neye odaklanmalı?", body: "En çok istediğiniz güncellemeyi seçin. Oyunuz gelecek projelerin önceliklerini belirlemeye yardımcı olur.", options: ["Minecraft oyun modları", "Fortnite adaları", "Mod paketleri", "Topluluk etkinlikleri"], goals: ["10 saat oyna", "100 saat oyna", "5 günlük seri yap", "20 günlük seri yap", "100 öldürme kazan", "25 oyun kazan"] },
  ja: { title: "Zo7alの次の優先事項は？", body: "最も楽しみにしている更新を選んでください。投票は今後の計画に役立ちます。", options: ["Minecraftのゲームモード", "Fortniteの島", "Modパック", "コミュニティイベント"], goals: ["10時間プレイ", "100時間プレイ", "5日連続でプレイ", "20日連続でプレイ", "100キル達成", "25試合に勝利"] },
  ko: { title: "Zo7al이 다음으로 집중할 분야는?", body: "가장 원하는 업데이트를 선택하세요. 투표는 다음 프로젝트의 우선순위를 정하는 데 도움이 됩니다.", options: ["Minecraft 게임 모드", "Fortnite 섬", "모드팩", "커뮤니티 이벤트"], goals: ["10시간 플레이", "100시간 플레이", "5일 연속 플레이", "20일 연속 플레이", "100킬 달성", "25경기 승리"] },
  zh: { title: "Zo7al接下来应优先更新什么？", body: "选择你最期待的更新。你的投票将帮助我们安排后续项目。", options: ["Minecraft游戏模式", "Fortnite岛屿", "模组包", "社区活动"], goals: ["游玩10小时", "游玩100小时", "连续游玩5天", "连续游玩20天", "达成100次击杀", "赢得25场比赛"] },
};

// These are real, editable entries. One poll ID and option order are shared by all languages.
export const COMMUNITY_STARTER_ENTRIES = [
  { kind: "poll", topic: "all", title: translations.en.title, body: translations.en.body, payload: { options: translations.en.options, endsAt: null, translations: Object.fromEntries(Object.entries(translations).map(([locale, value]) => [locale, { title: value.title, body: value.body, options: value.options }])) } },
  ...DEFAULT_ACHIEVEMENTS.map((goal, index) => ({ kind: "achievement", topic: "minecraft", title: translations.en.goals[index], body: "", payload: { stat: goal.stat, threshold: goal.threshold, translations: Object.fromEntries(Object.entries(translations).map(([locale, value]) => [locale, { title: value.goals[index], body: "" }])) } })),
];

export function localizeCommunityEntry(entry: CommunityEntry, locale: string): CommunityEntry {
  const { translations: raw, ...payload } = entry.payload;
  const translated = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>)[locale] : null;
  if (!translated || typeof translated !== "object" || Array.isArray(translated)) return { ...entry, payload };
  const value = translated as Record<string, unknown>;
  if (entry.kind === "poll" && Array.isArray(value.options) && Array.isArray(payload.options) && value.options.length === payload.options.length && value.options.every(option => typeof option === "string")) payload.options = value.options;
  return { ...entry, title: typeof value.title === "string" ? value.title : entry.title, body: typeof value.body === "string" ? value.body : entry.body, payload };
}
