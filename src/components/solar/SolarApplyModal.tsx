"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import SolidIcon from "@/components/ui/SolidIcon";
import {
  Check,
  LockKeyhole,
  UserCheck,
  LogIn,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useAccount } from "@/components/account/AccountProvider";
import AccountLogin from "@/components/account/AccountLogin";
import SolarSignaturePad from "./SolarSignaturePad";
import { solarCopy } from "@/lib/data/solar-copy";
import { solarModalsCopy } from "@/lib/data/solar-modals-i18n";
import { translateSolarRank } from "@/lib/data/solar-i18n";
import type {
  SolarRole,
  SolarAdminSubType,
  SolarGame,
  SolarApplicationInput,
} from "@/lib/data/solar";
import { SOLAR_CONTRACT_DURATIONS } from "@/lib/data/solar";

export default function SolarApplyModal({
  isOpen,
  onClose,
  initialRole = "creator",
  settings,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: SolarRole;
  settings?: {
    isOpen: boolean;
    announcement: string;
    closedRoles: string[];
    closedAdminSubTypes?: string[];
    closedGames?: string[];
    hiddenRoles?: string[];
    hiddenAdminSubTypes?: string[];
    hiddenGames?: string[];
    customRoles?: { id: string; label: string }[];
    customAdminSubTypes?: { id: string; label: string }[];
    customGames?: { id: string; label: string }[];
    labelOverrides?: Record<string, string>;
    fullPlanKeys?: string[];
  } | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const locale = useLocale();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const t = solarCopy(locale);
  const m = solarModalsCopy(locale);
  const ap = m.apply;
  const s = m.shared;

  const { account } = useAccount();
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [discord, setDiscord] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState<SolarRole>(initialRole);
  const [adminSubType, setAdminSubType] =
    useState<SolarAdminSubType>("dept_supervisor");
  const [game, setGame] = useState<SolarGame>("fortnite");
  const [channelUrl, setChannelUrl] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [experienceDuration, setExperienceDuration] = useState("");
  const [hasPreviousClans, setHasPreviousClans] = useState<boolean>(false);
  const [contractDuration, setContractDuration] = useState("3_months");
  const [contractDurationCustom, setContractDurationCustom] = useState("");
  const [signedContractUrl, setSignedContractUrl] = useState("");
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [whyJoin, setWhyJoin] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    reference: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      dialog.current?.close();
      return;
    }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const validateStep2 = () => {
    if (!name.trim()) return ap.errName;
    if (!nickname.trim()) return ap.errNickname;
    if (!age.trim()) return ap.errAge;
    if (!country.trim()) return ap.errCountry;
    if (!discord.trim()) return ap.errDiscord;
    if (!whatsapp.trim()) return ap.errPhone;
    if (!experienceDuration.trim()) return ap.errExperience;
    if (role === "creator" && !channelUrl.trim()) return ap.errChannel;
    if (role === "streamer" && !streamUrl.trim()) return ap.errStream;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const step2Err = validateStep2();
    if (step2Err) {
      setStep(2);
      setError(step2Err);
      return;
    }

    if (!contractDuration) {
      setError(ap.errCustomContract);
      return;
    }
    if (contractDuration === "other" && !contractDurationCustom.trim()) {
      setError(ap.errCustomContract);
      return;
    }
    if (!signedContractUrl) {
      setError(ap.errSignature);
      return;
    }
    if (!pledgeAgreed) {
      setError(ap.errPledge);
      return;
    }
    if (!whyJoin.trim()) {
      setError(ap.errWhyJoin);
      return;
    }

    const payload: SolarApplicationInput = {
      name: name.trim(),
      nickname: nickname.trim(),
      age: age.trim(),
      country: country.trim(),
      discord: discord.trim(),
      whatsapp: whatsapp.trim(),
      role,
      adminSubType: role === "admin" ? adminSubType : undefined,
      game:
        role === "player" ||
        (role === "admin" &&
          (adminSubType === "players_supervisor" ||
            adminSubType === "players_admin"))
          ? game
          : undefined,
      channelUrl: role === "creator" ? channelUrl.trim() : undefined,
      streamUrl: role === "streamer" ? streamUrl.trim() : undefined,
      portfolioUrl:
        role === "writer" || role === "editor" || role === "designer"
          ? portfolioUrl.trim()
          : undefined,
      experienceDuration: experienceDuration.trim(),
      hasPreviousClans,
      contractDuration,
      contractDurationCustom:
        contractDuration === "other" ? contractDurationCustom.trim() : undefined,
      signedContractUrl: signedContractUrl ? signedContractUrl.trim() : undefined,
      pledgeAgreed,
      whyJoin: whyJoin.trim(),
      bio: whyJoin.trim(),
    };

    setBusy(true);
    try {
      const res = await fetch("/api/solar/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === "AUTH_REQUIRED") {
          setError(s.errAuth);
        } else if (data.error === "RECRUITMENT_CLOSED") {
          setError(ap.closedTitle);
        } else if (data.error === "ROLE_CLOSED") {
          setError(ap.closedTitle);
        } else if (data.error === "RATE_LIMIT") {
          setError(s.errRateLimit);
        } else if (data.error === "ALREADY_APPLIED") {
          setError(ap.errAlreadyApplied);
        } else {
          setError(s.errServer);
        }
        return;
      }
      setSuccess({ reference: data.reference, token: data.token });
    } catch {
      setError(s.errNetwork);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setName("");
    setNickname("");
    setAge("");
    setCountry("");
    setDiscord("");
    setWhatsapp("");
    setWhyJoin("");
    setChannelUrl("");
    setStreamUrl("");
    setPortfolioUrl("");
    setSignedContractUrl("");
    setPledgeAgreed(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const NextIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="solar-apply-dialog-title"
      className="checkout-shell store-checkout max-w-2xl"
    >
      <header className="store-checkout-header" dir={dir}>
        <div className="store-checkout-brand">
          <span className="store-rank-icon">
            <SolidIcon name="trophy" size={20} />
          </span>
          <div>
            <h2 id="solar-apply-dialog-title" className="font-semibold text-lg">
              {ap.title}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {step === 1 && ap.step1Sub}
              {step === 2 && ap.step2Sub}
              {step === 3 && ap.step3Sub}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="store-close"
          onClick={onClose}
          aria-label={s.closeAria}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="store-checkout-body" dir={dir}>
        {success ? (
          <div className="space-y-6 text-center py-4">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              <Check size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text)]">
                {t.applicationReceived}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                {t.applicationReceivedDesc}
              </p>
            </div>
            <div
              className="card-glow rounded-xl border p-4 max-w-sm mx-auto"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="text-xs text-[var(--text-muted)]">{t.trackingReference}</p>
              <code dir="ltr" className="mt-1 block text-sm font-bold text-[var(--accent)]">
                {success.reference}
              </code>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/tracking?reference=${encodeURIComponent(success.reference)}`}
                className="store-action store-action-primary"
              >
                {t.trackRequest} ↗
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="store-action"
              >
                {t.close}
              </button>
            </div>
          </div>
        ) : settings && !settings.isOpen ? (
          <div className="space-y-6 text-center py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <LockKeyhole size={30} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                {ap.closedTitle}
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {settings.announcement || ap.closedFallback}
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-7 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        ) : !account ? (
          <div className="space-y-6 text-center py-6">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border"
              style={{
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                color: "var(--accent)",
              }}
            >
              <LockKeyhole size={30} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                {t.loginRequiredTitle}
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {t.loginRequiredDesc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold transition-transform active:scale-95 cursor-pointer"
                style={{ background: "var(--accent)", color: "#07080b" }}
              >
                <LogIn size={15} />
                {t.loginNow}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>

            {showLogin && (
              <AccountLogin
                next="/solar"
                onClose={() => setShowLogin(false)}
              />
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Step Navigation Wizard */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 font-medium transition-colors ${
                  step === 1 ? "text-[var(--accent)] font-bold" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[11px]">
                  1
                </span>
                <span>{ap.step1Tab}</span>
              </button>

              <span className="text-[var(--border-strong)]">──</span>

              <button
                type="button"
                onClick={() => setStep(2)}
                className={`flex items-center gap-1.5 font-medium transition-colors ${
                  step === 2 ? "text-[var(--accent)] font-bold" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[11px]">
                  2
                </span>
                <span>{ap.step2Tab}</span>
              </button>

              <span className="text-[var(--border-strong)]">──</span>

              <button
                type="button"
                onClick={() => {
                  const err = validateStep2();
                  if (err) {
                    setError(err);
                  } else {
                    setError(null);
                    setStep(3);
                  }
                }}
                className={`flex items-center gap-1.5 font-medium transition-colors ${
                  step === 3 ? "text-[var(--accent)] font-bold" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[11px]">
                  3
                </span>
                <span>{ap.step3Tab}</span>
              </button>
            </div>

            {/* Account Info Badge */}
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/20 p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <UserCheck size={14} />
                </div>
                <div className="leading-tight">
                  <span className="text-[var(--text-muted)] text-[11px]">{s.yourAccount} </span>
                  <strong className="text-[var(--text)]">
                    {account.name || account.username || account.email}
                  </strong>
                </div>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)",
                }}
              >
                {t.verifiedAccount}
              </span>
            </div>

            {error && (
              <div
                className="rounded-xl border p-3 text-xs text-red-400"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.25)",
                }}
              >
                {error}
              </div>
            )}

            {/* STEP 1: RULES & GUIDELINES */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 max-h-[380px] overflow-y-auto space-y-4 text-xs leading-relaxed text-[var(--text)]">
                  <div className="border-b border-[var(--border)] pb-2">
                    <h3 className="font-bold text-sm text-[var(--accent)]">
                      {ap.rulesHeading}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      {ap.rulesIntro}
                    </p>
                  </div>

                  {ap.ruleSections.map((sec, idx) => (
                    <div key={sec.title}>
                      <h4 className="font-bold text-[var(--text)] mb-1">{sec.title}</h4>
                      {sec.items && (
                        <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] ps-2">
                          {sec.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {sec.text && (
                        <p className="text-[var(--text-muted)]">{sec.text}</p>
                      )}
                      {idx === ap.ruleSections.length - 1 && (
                        <a
                          href="https://discord.gg/bCHAGPTUm"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
                        >
                          <span>{ap.discordLinkLabel}</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="store-action store-action-primary w-full flex items-center justify-center gap-2"
                  >
                    <span>{ap.continueToStep2}</span>
                    <NextIcon size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL INFO & ROLE */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.nameLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={ap.namePlaceholder}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.nicknameLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={ap.nicknamePlaceholder}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.ageLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder={ap.agePlaceholder}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.countryLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder={ap.countryPlaceholder}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.discordLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      dir="ltr"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      placeholder={ap.discordPlaceholder}
                      className={`w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] ${isAr ? "text-right" : "text-left"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.phoneLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={24}
                      dir="ltr"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+966 5x xxx xxxx"
                      className={`w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] ${isAr ? "text-right" : "text-left"}`}
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    {ap.roleLabel} <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as SolarRole)}
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  >
                    {[
                      { id: "creator", label: ap.roles.creator },
                      { id: "streamer", label: ap.roles.streamer },
                      { id: "designer", label: ap.roles.designer },
                      { id: "editor", label: ap.roles.editor },
                      { id: "player", label: ap.roles.player },
                      { id: "admin", label: ap.roles.admin },
                      { id: "writer", label: ap.roles.writer },
                      ...(settings?.customRoles ?? []).map((r) => ({
                        id: r.id,
                        label: translateSolarRank(r.label, locale),
                      })),
                    ]
                      .filter((r) => !settings?.hiddenRoles?.includes(r.id))
                      .map((r) => {
                        const isClosed = settings?.closedRoles.includes(r.id);
                        const override = settings?.labelOverrides?.[`role:${r.id}`];
                        const label = override
                          ? translateSolarRank(override, locale)
                          : r.label;
                        return (
                          <option key={r.id} value={r.id} disabled={isClosed}>
                            {label} {isClosed ? s.closedBadge : ""}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Subfield if player */}
                {role === "player" && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text-muted)]">
                      {ap.gameLabel} <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={game}
                      onChange={(e) => setGame(e.target.value as SolarGame)}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    >
                      {[
                        { id: "fortnite", label: ap.games.fortnite },
                        { id: "rocket", label: ap.games.rocket },
                        { id: "minecraft", label: ap.games.minecraft },
                        { id: "fifa", label: ap.games.fifa },
                        { id: "cod", label: ap.games.cod },
                        ...(settings?.customGames ?? []).map((g) => ({
                          id: g.id,
                          label: translateSolarRank(g.label, locale),
                        })),
                      ]
                        .filter((g) => !settings?.hiddenGames?.includes(g.id))
                        .map((g) => {
                          const isManualClosed = settings?.closedGames?.includes(g.id);
                          const isQuotaFull = settings?.fullPlanKeys?.includes(`player:${g.id}`);
                          const isClosed = Boolean(isManualClosed || isQuotaFull);
                          const override = settings?.labelOverrides?.[`game:${g.id}`];
                          const label = override
                            ? translateSolarRank(override, locale)
                            : g.label;
                          return (
                            <option key={g.id} value={g.id} disabled={isClosed}>
                              {label} {isQuotaFull ? s.fullBadge : isManualClosed ? s.closedBadge : ""}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                )}

                {/* Subfield if admin */}
                {role === "admin" && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                        {ap.adminSubTypeLabel} <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={adminSubType}
                        onChange={(e) =>
                          setAdminSubType(e.target.value as SolarAdminSubType)
                        }
                        className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      >
                        {[
                          { id: "president", label: ap.adminSubTypes.president },
                          { id: "vice_president", label: ap.adminSubTypes.vice_president },
                          { id: "exec_supervisor", label: ap.adminSubTypes.exec_supervisor },
                          { id: "dept_supervisor", label: ap.adminSubTypes.dept_supervisor },
                          { id: "general_admin", label: ap.adminSubTypes.general_admin },
                          { id: "admin_monitor", label: ap.adminSubTypes.admin_monitor },
                          { id: "creators_supervisor", label: ap.adminSubTypes.creators_supervisor },
                          { id: "creators_admin", label: ap.adminSubTypes.creators_admin },
                          { id: "designers_supervisor", label: ap.adminSubTypes.designers_supervisor },
                          { id: "players_supervisor", label: ap.adminSubTypes.players_supervisor },
                          { id: "players_admin", label: ap.adminSubTypes.players_admin },
                          { id: "editors_supervisor", label: ap.adminSubTypes.editors_supervisor },
                          { id: "streamers_supervisor", label: ap.adminSubTypes.streamers_supervisor },
                          ...(settings?.customAdminSubTypes ?? []).map((sub) => ({
                            id: sub.id,
                            label: translateSolarRank(sub.label, locale),
                          })),
                        ]
                          .filter((sub) => !settings?.hiddenAdminSubTypes?.includes(sub.id))
                          .map((sub) => {
                            const isClosed = settings?.closedAdminSubTypes?.includes(sub.id);
                            const override = settings?.labelOverrides?.[`sub:${sub.id}`];
                            const label = override
                              ? translateSolarRank(override, locale)
                              : sub.label;
                            return (
                              <option key={sub.id} value={sub.id} disabled={isClosed}>
                                {label} {isClosed ? s.closedBadge : ""}
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {(adminSubType === "players_supervisor" ||
                      adminSubType === "players_admin") && (
                      <div className="pt-2 border-t border-[var(--border)]">
                        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                          {ap.adminGameLabel} <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={game}
                          onChange={(e) => setGame(e.target.value as SolarGame)}
                          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                        >
                          {[
                            { id: "fifa", label: ap.games.fifa },
                            { id: "fortnite", label: ap.games.fortnite },
                            { id: "rocket", label: ap.games.rocket },
                            { id: "minecraft", label: ap.games.minecraft },
                            { id: "cod", label: ap.games.cod },
                            ...(settings?.customGames ?? []).map((g) => ({
                              id: g.id,
                              label: translateSolarRank(g.label, locale),
                            })),
                          ]
                            .filter((g) => !settings?.hiddenGames?.includes(g.id))
                            .map((g) => {
                              const isManualClosed = settings?.closedGames?.includes(g.id);
                              const isQuotaFull = settings?.fullPlanKeys?.includes(
                                `admin:${adminSubType}:${g.id}`
                              );
                              const isClosed = Boolean(isManualClosed || isQuotaFull);
                              const override = settings?.labelOverrides?.[`game:${g.id}`];
                              const label = override
                                ? translateSolarRank(override, locale)
                                : g.label;
                              return (
                                <option key={g.id} value={g.id} disabled={isClosed}>
                                  {label} {isQuotaFull ? s.fullBadge : isManualClosed ? s.closedBadge : ""}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Channel / Stream URL */}
                {(role === "creator" || role === "streamer") && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.channelLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      dir="ltr"
                      value={role === "creator" ? channelUrl : streamUrl}
                      onChange={(e) =>
                        role === "creator"
                          ? setChannelUrl(e.target.value)
                          : setStreamUrl(e.target.value)
                      }
                      placeholder={
                        role === "creator"
                          ? ap.channelPlaceholderCreator
                          : ap.channelPlaceholderStreamer
                      }
                      className={`w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] ${isAr ? "text-right" : "text-left"}`}
                    />
                  </div>
                )}

                {/* Portfolio URL */}
                {(role === "writer" || role === "editor" || role === "designer") && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.portfolioLabel}
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="Drive, Behance, YouTube, etc."
                      className={`w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] ${isAr ? "text-right" : "text-left"}`}
                    />
                  </div>
                )}

                {/* Experience & Previous Clans */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.experienceLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={experienceDuration}
                      onChange={(e) => setExperienceDuration(e.target.value)}
                      placeholder={ap.experiencePlaceholder}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {ap.prevClansLabel} <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={hasPreviousClans ? "yes" : "no"}
                      onChange={(e) => setHasPreviousClans(e.target.value === "yes")}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    >
                      <option value="yes">{s.yes}</option>
                      <option value="no">{s.no}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <BackIcon size={14} />
                    {ap.backToRules}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const err = validateStep2();
                      if (err) {
                        setError(err);
                        return;
                      }
                      setError(null);
                      setStep(3);
                    }}
                    className="store-action store-action-primary flex items-center gap-2"
                  >
                    <span>{ap.continueToStep3}</span>
                    <NextIcon size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONTRACT, PLEDGE & WHY JOIN */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Contract Duration */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    {ap.contractDurationLabel} <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={contractDuration}
                    onChange={(e) => setContractDuration(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  >
                    {SOLAR_CONTRACT_DURATIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {ap.contractDurations[d.id] || d.label}
                      </option>
                    ))}
                  </select>

                  {contractDuration === "other" && (
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={contractDurationCustom}
                      onChange={(e) => setContractDurationCustom(e.target.value)}
                      placeholder={ap.contractDurationCustomPlaceholder}
                      className="mt-2 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  )}
                </div>

                {/* Contract Signature / Upload */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    {ap.contractImageLabel} <span className="text-red-400">*</span>
                  </label>
                  <SolarSignaturePad
                    value={signedContractUrl}
                    onChange={(url) => setSignedContractUrl(url)}
                  />
                </div>

                {/* Written Pledge Card */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
                    <ShieldCheck size={16} />
                    <span>{ap.pledgeTitle}</span>
                  </div>
                  <p className="text-[var(--text)]">{ap.pledgeIntro}</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] ps-2">
                    {ap.pledgeItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="font-bold text-[var(--accent)] pt-1 text-[11px]">
                    {ap.pledgeMotto}
                  </p>

                  <label className="flex items-center gap-2 pt-2 border-t border-[var(--border)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pledgeAgreed}
                      onChange={(e) => setPledgeAgreed(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="font-semibold text-xs text-[var(--text)]">
                      {ap.pledgeAgree} <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>

                {/* Why Join */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    {ap.whyJoinLabel} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={2000}
                    value={whyJoin}
                    onChange={(e) => setWhyJoin(e.target.value)}
                    placeholder={ap.whyJoinPlaceholder}
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] leading-relaxed"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <BackIcon size={14} />
                    {ap.editInfo}
                  </button>

                  <button
                    type="submit"
                    disabled={busy || !pledgeAgreed}
                    className="store-action store-action-primary px-8"
                  >
                    {busy ? ap.submitting : ap.submitBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
