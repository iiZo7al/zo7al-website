"use client";
import MarkdownTextarea from "@/components/ui/MarkdownTextarea";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import {
  UserRound,
  Search,
  ShieldBan,
  Trash2,
  ShieldCheck,
  KeyRound,
  Check,
} from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import {
  DASHBOARD_PERMISSION_LABELS,
  DASHBOARD_SPECIFIC_PERMISSIONS,
  type DashboardPermission,
} from "@/lib/data/dashboard-permissions";
type Profile = {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  bannedUntil: string | null;
  banReason: string;
  deletedAt: string | null;
  permissions?: DashboardPermission[];
  isOwner?: boolean;
};
export default function MemberProfiles({
  onExpired,
}: {
  onExpired: () => void;
}) {
  const t = useTranslations("account"),
    h = useTranslations("hub"),
    locale = useLocale();
  const isAr = locale === "ar";
  const [profiles, setProfiles] = useState<Profile[]>([]),
    [query, setQuery] = useState(""),
    [version, setVersion] = useState(0),
    [selected, setSelected] = useState<Profile | null>(null),
    [permProfile, setPermProfile] = useState<Profile | null>(null),
    [permDraft, setPermDraft] = useState<DashboardPermission[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [now, setNow] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch("/api/admin/profiles?q=" + encodeURIComponent(query), {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (r) => {
          if (r.status === 401) {
            onExpired();
            return;
          }
          if (!r.ok) throw Error();
          const data = await r.json();
          if (!controller.signal.aborted) {
            setProfiles(data.profiles);
            setNow(Date.now());
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setError(h("unavailable"));
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, version, onExpired, h]);
  async function act(
    profile: Profile,
    action: string,
    reason = "",
    until: string | null = null,
  ) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profile.id, action, reason, until }),
      });
      if (response.status === 401) {
        onExpired();
        return;
      }
      if (!response.ok) {const data=await response.json().catch(()=>({}));throw Error(data.error??"UNAVAILABLE");}
      setSelected(null);
      setVersion((v) => v + 1);
    } catch(error) {
      const key=error instanceof Error?error.message:"UNAVAILABLE";setError(t.has("errors."+key)?t("errors."+key):h("unavailable"));
    } finally {
      setBusy(false);
    }
  }
  async function savePermissions(nextPermissions: DashboardPermission[]) {
    if (!permProfile) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: permProfile.id,
          action: "permissions",
          permissions: nextPermissions,
        }),
      });
      if (response.status === 401) {
        onExpired();
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw Error(data.error ?? "UNAVAILABLE");
      }
      setPermProfile(null);
      setVersion((v) => v + 1);
    } catch (err) {
      const key = err instanceof Error ? err.message : "UNAVAILABLE";
      setError(t.has("errors." + key) ? t("errors." + key) : h("unavailable"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="dash-section-heading">
        <h2>{t("profiles")}</h2>
        <UserRound size={22} />
      </div>
      <label className="dash-search mb-6">
        <Search size={17} />
        <input
          aria-label={t("searchMembers")}
          placeholder={t("searchMembers")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="hub-error mb-5">
          {error}
        </p>
      )}
      <div className="community-admin-list">
        {profiles.map((p) => {
          const banned = !!p.bannedUntil && Date.parse(p.bannedUntil) > now;
          const perms = p.permissions ?? [];
          const hasAll = p.isOwner || perms.includes("all");
          return (
            <article key={p.id} className="community-admin-entry">
              <div className="flex items-center gap-3">
                {p.avatar ? (
                  <Image
                    unoptimized
                    src={p.avatar}
                    width={48}
                    height={48}
                    alt=""
                    className="rounded-full"
                  />
                ) : (
                  <UserRound size={32} />
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3>{p.name}</h3>
                    {p.isOwner ? (
                      <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                        {isAr ? "المالك" : "Owner"}
                      </span>
                    ) : hasAll ? (
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                        {isAr ? "كل الصلاحيات" : "Full Access"}
                      </span>
                    ) : perms.length > 0 ? (
                      <span className="rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                        {isAr ? `${perms.length} صلاحيات` : `${perms.length} permissions`}
                      </span>
                    ) : null}
                  </div>
                  {p.username && (
                    <Link href={"/@" + p.username} dir="ltr">
                      @{p.username}
                    </Link>
                  )}
                  {p.deletedAt ? (
                    <p>{t("deleted")}</p>
                  ) : (
                    banned && (
                      <p>
                        {t("banned")} ·{" "}
                        {p.bannedUntil!.startsWith("9999")
                          ? t("permanent")
                          : new Intl.DateTimeFormat(locale, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(p.bannedUntil!))}
                      </p>
                    )
                  )}
                </div>
              </div>
              {!p.deletedAt && (
                <div className="dash-actions">
                  {!p.isOwner && (
                    <button
                      type="button"
                      className="dash-button"
                      disabled={busy}
                      onClick={() => {
                        setPermProfile(p);
                        setPermDraft(p.permissions ?? []);
                      }}
                    >
                      <KeyRound size={16} />
                      {isAr ? "الصلاحيات" : "Permissions"}
                    </button>
                  )}
                  {banned ? (
                    <button
                      className="dash-button"
                      disabled={busy}
                      onClick={() => void act(p, "unban")}
                    >
                      <ShieldCheck size={16} />
                      {t("unbanAccount")}
                    </button>
                  ) : (
                    <button
                      className="dash-button"
                      disabled={busy}
                      onClick={() => setSelected(p)}
                    >
                      <ShieldBan size={16} />
                      {t("banAccount")}
                    </button>
                  )}
                  <button
                    className="dash-button dash-danger"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(t("confirmDelete")))
                        void act(p, "delete");
                    }}
                  >
                    <Trash2 size={16} />
                    {t("deleteAccount")}
                  </button>
                </div>
              )}
              {p.deletedAt&&<button type="button" className="dash-button" disabled={busy} onClick={()=>{if(window.confirm(t("confirmDelete")))void act(p,"delete");}}><Trash2 size={16}/>{t("deleteAccount")}</button>}
            </article>
          );
        })}
      </div>
      {permProfile && (
        <DetailsDialog
          title={
            (isAr ? "صلاحيات لوحة التحكم · " : "Dashboard Permissions · ") +
            permProfile.name
          }
          onClose={() => setPermProfile(null)}
          style={{ width: "min(620px, calc(100vw - 24px))" }}
        >
          <div className="p-6 space-y-5" dir={isAr ? "rtl" : "ltr"}>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {isAr
                ? "يمكنك منح العضو كل الصلاحيات أو اختيار صلاحيات محددة. عند منحه أي صلاحية سيظهر له رابط «لوحة التحكم» في قائمة حسابه."
                : "Grant full access or specific dashboard sections. Once granted, the Dashboard link appears in their account menu."}
            </p>

            {/* All permissions toggle */}
            <button
              type="button"
              onClick={() =>
                setPermDraft((prev) =>
                  prev.includes("all") ? [] : ["all"],
                )
              }
              className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-sm font-semibold transition-colors ${
                permDraft.includes("all")
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--border-strong)]"
              }`}
            >
              <span>
                {isAr
                  ? DASHBOARD_PERMISSION_LABELS.all.ar
                  : DASHBOARD_PERMISSION_LABELS.all.en}
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  permDraft.includes("all")
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[#07080b]"
                    : "border-[var(--border-strong)]"
                }`}
              >
                {permDraft.includes("all") && <Check size={14} />}
              </span>
            </button>

            {/* Specific permissions grid */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                {isAr ? "أو صلاحيات محددة:" : "Or specific permissions:"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pe-1">
                {DASHBOARD_SPECIFIC_PERMISSIONS.map((perm) => {
                  const checked =
                    permDraft.includes("all") || permDraft.includes(perm);
                  const disabled = permDraft.includes("all");
                  return (
                    <button
                      key={perm}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        setPermDraft((prev) => {
                          const base = prev.filter((x) => x !== "all");
                          return base.includes(perm)
                            ? base.filter((x) => x !== perm)
                            : [...base, perm];
                        })
                      }
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                        checked
                          ? "border-[var(--accent)]/60 bg-[var(--accent)]/10 text-[var(--text)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <span>
                        {isAr
                          ? DASHBOARD_PERMISSION_LABELS[perm].ar
                          : DASHBOARD_PERMISSION_LABELS[perm].en}
                      </span>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[#07080b]"
                            : "border-[var(--border-strong)]"
                        }`}
                      >
                        {checked && <Check size={11} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={busy}
                onClick={() => void savePermissions([])}
                className="dash-button dash-danger text-xs"
              >
                {isAr ? "إزالة كل الصلاحيات" : "Revoke All"}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPermProfile(null)}
                  className="dash-button text-xs"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void savePermissions(permDraft)}
                  className="dash-button dash-button-primary text-xs"
                >
                  {isAr ? "حفظ الصلاحيات" : "Save Permissions"}
                </button>
              </div>
            </div>
          </div>
        </DetailsDialog>
      )}
      {selected && (
        <DetailsDialog
          title={t("banAccount") + " · " + selected.name}
          onClose={() => setSelected(null)}
        >
          <form
            className="hub-form p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ends = String(f.get("until"));
              void act(
                selected,
                "ban",
                String(f.get("reason")),
                ends ? new Date(ends).toISOString() : null,
              );
            }}
          >
            <label>
              {t("banReason")}
              <MarkdownTextarea name="reason" maxLength={500} rows={3} />
            </label>
            <label>
              {t("temporaryBan")}
              <input
                name="until"
                type="datetime-local"
                min={new Date(
                  now + 60000 - new Date().getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
              />
              <small>{t("emptyPermanent")}</small>
            </label>
            <button disabled={busy} className="hub-button hub-button-primary">
              {t("banAccount")}
            </button>
          </form>
        </DetailsDialog>
      )}
    </section>
  );
}
