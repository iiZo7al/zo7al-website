"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowUpRight,
  Blocks,
  CheckCircle2,
  Crown,
  Gamepad2,
  Gem,
  Lock,
  MoonStar,
  Orbit,
  RotateCcw,
  Sparkles,
  Sun,
  Terminal,
} from "lucide-react";
import {
  discoverEasterEgg,
  EASTER_EGG_CHANGE_EVENT,
  EASTER_EGGS,
  getDiscoveredEasterEggs,
  resetEasterEggs,
  type EasterEggId,
  type EasterEggRarity,
} from "@/lib/data/easter-eggs";

type FilterMode = "all" | "discovered" | "locked";

function EggIcon({ id, size = 24 }: { id: EasterEggId; size?: number }) {
  switch (id) {
    case "saturn_nova":
      return <Orbit size={size} aria-hidden="true" />;
    case "creeper_boom":
      return <Blocks size={size} aria-hidden="true" />;
    case "diamond_ore":
      return <Gem size={size} aria-hidden="true" />;
    case "night_owl":
      return <MoonStar size={size} aria-hidden="true" />;
    case "solar_eclipse":
      return <Sun size={size} aria-hidden="true" />;
    case "footer_relic":
      return <Terminal size={size} aria-hidden="true" />;
    case "konami_code":
      return <Gamepad2 size={size} aria-hidden="true" />;
    case "master_collector":
      return <Crown size={size} aria-hidden="true" />;
    default:
      return <Sparkles size={size} aria-hidden="true" />;
  }
}

const RARITY_META: Record<
  EasterEggRarity,
  {
    color: string;
    bg: string;
    border: string;
    labelAr: string;
    labelEn: string;
  }
> = {
  common: {
    color: "#cbd5e1",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.3)",
    labelAr: "عادي",
    labelEn: "Common",
  },
  rare: {
    color: "#7dd3fc",
    bg: "rgba(56,189,248,0.12)",
    border: "rgba(56,189,248,0.35)",
    labelAr: "نادر",
    labelEn: "Rare",
  },
  epic: {
    color: "#e9d5ff",
    bg: "rgba(192,132,252,0.14)",
    border: "rgba(192,132,252,0.38)",
    labelAr: "ملحمي",
    labelEn: "Epic",
  },
  legendary: {
    color: "#fde68a",
    bg: "rgba(251,191,36,0.14)",
    border: "rgba(251,191,36,0.45)",
    labelAr: "أسطوري",
    labelEn: "Legendary",
  },
};

function getCollectorRank(count: number, isArabic: boolean): string {
  if (count === 0) return isArabic ? "مستكشف مبتدئ" : "Curious Wanderer";
  if (count < 3) return isArabic ? "باحث عن الأسرار" : "Secret Seeker";
  if (count < 6) return isArabic ? "صائد ألغاز" : "Riddle Hunter";
  if (count < EASTER_EGGS.length) return isArabic ? "خبير الخزنة" : "Vault Specialist";
  return isArabic ? "أسطورة زحل" : "Zo7al Legend";
}

export default function EasterEggsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [discovered, setDiscovered] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<FilterMode>("all");
  const [secretInput, setSecretInput] = useState("");
  const [terminalMsg, setTerminalMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    const sync = () => setDiscovered(getDiscoveredEasterEggs());
    sync();
    window.addEventListener(EASTER_EGG_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EASTER_EGG_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const totalCount = EASTER_EGGS.length;
  const foundCount = Object.keys(discovered).length;
  const progressPct = Math.round((foundCount / totalCount) * 100);
  const collectorRank = getCollectorRank(foundCount, isArabic);

  const filteredEggs = useMemo(() => {
    return EASTER_EGGS.filter((egg) => {
      const isFound = Boolean(discovered[egg.id]);
      if (filter === "discovered") return isFound;
      if (filter === "locked") return !isFound;
      return true;
    });
  }, [discovered, filter]);

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = secretInput.trim().toLowerCase();
    if (!code) return;

    const codeMap: Record<string, EasterEggId> = {
      creeper: "creeper_boom",
      diamond: "diamond_ore",
      zo7al: "night_owl",
      "up up down down left right left right b a": "konami_code",
      konami: "konami_code",
    };

    const target = codeMap[code];
    if (!target) {
      setTerminalMsg({
        ok: false,
        text: isArabic
          ? "شيفرة غير معروفة... ابحث عن التلميحات في البطاقات أو في أرجاء الموقع."
          : "Unknown code... check the card hints or explore the site.",
      });
      return;
    }

    const newlyUnlocked = discoverEasterEgg(target);
    setSecretInput("");
    setTerminalMsg({
      ok: true,
      text: newlyUnlocked
        ? isArabic
          ? "تم فك تشفير السر وإضافته إلى خزنتك!"
          : "Secret decrypted and added to your vault!"
        : isArabic
          ? "هذا السر مفتوح مسبقًا في خزنتك."
          : "You already unlocked this secret.",
    });
  };

  return (
    <main data-accent="home" className="min-h-[75dvh] px-6 pb-24 pt-36 sm:pt-44">
      <div className="mx-auto max-w-[1120px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-label mb-3">ZO7AL PROJECTS · SECRET VAULT</p>
            <h1 className="text-display text-4xl sm:text-6xl">
              {isArabic ? "خزنة الأسرار" : "Secret Vault"}
              <span style={{ color: "var(--accent)" }}>.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              {isArabic
                ? "أسرار وألغاز مخفية في أرجاء الموقع — تفاعل مع العناصر ثلاثية الأبعاد، آلة الكتابة، والشيفرات السرية لجمعها كلها."
                : "Hidden secrets and riddles scattered across the site — interact with 3D scenes, the homepage typewriter, and cheat codes to collect them all."}
            </p>
          </div>

          {foundCount > 0 && (
            <button
              type="button"
              onClick={() => {
                resetEasterEggs();
                setTerminalMsg(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
            >
              <RotateCcw size={14} aria-hidden="true" />
              {isArabic ? "إعادة تعيين التقدم" : "Reset Progress"}
            </button>
          )}
        </div>

        {/* Progress & Rank Card */}
        <section className="card-glow mt-10 rounded-3xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-label">
                {isArabic ? "رتبة المستكشف" : "COLLECTOR RANK"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--text)]">
                {collectorRank}
              </h2>
            </div>
            <div className="text-end">
              <p className="text-3xl font-bold tracking-tight text-[var(--text)]">
                {foundCount}{" "}
                <span className="text-base font-normal text-[var(--text-muted)]">
                  / {totalCount}
                </span>
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {progressPct}% {isArabic ? "مكتمل" : "Complete"}
              </p>
            </div>
          </div>

          <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "var(--accent)",
              }}
            />
          </div>

          {/* Interactive Secret Code Terminal */}
          <form
            onSubmit={handleSecretSubmit}
            className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Terminal
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                dir="ltr"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder={
                  isArabic
                    ? "أدخل شيفرة سرية... (مثل: creeper, diamond, zo7al)"
                    : "Enter a secret code... (e.g. creeper, diamond, zo7al)"
                }
                className="w-full rounded-xl border border-[var(--border)] bg-black/30 py-2.5 pe-4 ps-10 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)", color: "#07080B" }}
            >
              <Sparkles size={15} aria-hidden="true" />
              {isArabic ? "فك التشفير" : "Decrypt"}
            </button>
          </form>
          {terminalMsg && (
            <p
              className={`mt-3 text-xs font-medium ${
                terminalMsg.ok ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {terminalMsg.text}
            </p>
          )}
        </section>

        {/* Filter Tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {(
            [
              {
                key: "all",
                label: isArabic ? `الكل (${totalCount})` : `All (${totalCount})`,
              },
              {
                key: "discovered",
                label: isArabic
                  ? `المكتشفة (${foundCount})`
                  : `Discovered (${foundCount})`,
              },
              {
                key: "locked",
                label: isArabic
                  ? `المقفلة (${totalCount - foundCount})`
                  : `Locked (${totalCount - foundCount})`,
              },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-[var(--accent)] bg-[var(--glow)] text-[var(--text)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Eggs Grid */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {filteredEggs.map((egg) => {
            const unlockedAt = discovered[egg.id];
            const isFound = Boolean(unlockedAt);
            const rarity = RARITY_META[egg.rarity];

            return (
              <article
                key={egg.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all ${
                  isFound
                    ? "card-glow bg-[var(--surface)]"
                    : "border-[var(--border)] bg-[var(--surface)]/55 opacity-85"
                }`}
                style={
                  isFound
                    ? { borderColor: rarity.border }
                    : undefined
                }
              >
                <div className="flex items-start gap-4">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                    style={
                      isFound
                        ? { background: rarity.bg, color: rarity.color }
                        : {
                            background: "rgba(255,255,255,0.04)",
                            color: "var(--text-muted)",
                          }
                    }
                  >
                    {isFound ? (
                      <EggIcon id={egg.id} size={23} />
                    ) : (
                      <Lock size={20} aria-hidden="true" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: rarity.bg, color: rarity.color }}
                      >
                        {isArabic ? rarity.labelAr : rarity.labelEn}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {isArabic ? egg.locationAr : egg.locationEn}
                      </span>
                    </div>

                    <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">
                      {isFound
                        ? isArabic
                          ? egg.titleAr
                          : egg.titleEn
                        : isArabic
                          ? "سر مقفل"
                          : "Locked Secret"}
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">
                      {isFound
                        ? isArabic
                          ? egg.secretAr
                          : egg.secretEn
                        : isArabic
                          ? egg.hintAr
                          : egg.hintEn}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-3.5 text-xs text-[var(--text-muted)]">
                  {isFound ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
                      <CheckCircle2 size={14} aria-hidden="true" />
                      {isArabic ? "تم الاكتشاف" : "Unlocked"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Lock size={13} aria-hidden="true" />
                      {isArabic ? "تلميح متاح" : "Hint available"}
                    </span>
                  )}
                  {isFound && unlockedAt && (
                    <span dir="ltr">
                      {new Date(unlockedAt).toLocaleDateString(
                        isArabic ? "ar-SA" : "en-US",
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        >
          {isArabic ? "العودة للرئيسية" : "Back to home"}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
