"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Plus,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  formatSolarMemberRank,
  parseSolarMemberRank,
  roleNeedsGame,
  SOLAR_MEMBER_ADMIN_SUBTYPES,
  SOLAR_MEMBER_GAMES,
  SOLAR_MEMBER_ROLES,
  SOLAR_MEMBER_SOCIAL_PLATFORMS,
  type SolarMember,
  type SolarMemberSocial,
  type SolarMemberSocialPlatform,
} from "@/lib/data/solar-members";
import { solarDashboardCopy } from "@/lib/data/solar-dashboard-i18n";
import { translateSolarRank } from "@/lib/data/solar-i18n";

const EMPTY_FORM = {
  id: "",
  name: "",
  rank: "",
  role: "",
  adminSubType: "",
  game: "",
  avatar: "",
  bio: "",
  socials: [] as SolarMemberSocial[],
};

export default function SolarMembersManager({
  onExpired,
}: {
  onExpired: () => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const mb = solarDashboardCopy(locale).members;

  const [members, setMembers] = useState<SolarMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/solar/members", { cache: "no-store" })
      .then(async (res) => {
        if (!active) return;
        if (res.status === 401) {
          onExpired();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setMembers(Array.isArray(data.members) ? data.members : []);
          }
        }
      })
      .catch(() => {
        if (active) setError(mb.loadError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onExpired, mb.loadError]);

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/solar/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(mb.uploadError);
        return;
      }
      setForm((prev) => ({ ...prev, avatar: data.url }));
    } catch {
      setError(mb.uploadNetworkError);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.rank.trim()) {
      setError(mb.requiredError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/solar/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          member: {
            id: form.id || undefined,
            name: form.name.trim(),
            rank: form.rank.trim(),
            avatar: form.avatar.trim(),
            bio: form.bio.trim(),
            socials: form.socials.filter((s) => s.url.trim()),
          },
        }),
      });
      if (res.status === 401) {
        onExpired();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(mb.saveError);
        return;
      }
      setMembers(data.members ?? []);
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      setError(mb.networkError);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(mb.confirmDelete)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/solar/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.status === 401) {
        onExpired();
        return;
      }
      const data = await res.json();
      if (res.ok && data.ok) setMembers(data.members ?? []);
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/solar/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", id, direction }),
      });
      if (res.status === 401) {
        onExpired();
        return;
      }
      const data = await res.json();
      if (res.ok && data.ok) setMembers(data.members ?? []);
    } finally {
      setBusy(false);
    }
  };

  const openNew = () => {
    setError("");
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (m: SolarMember) => {
    setError("");
    const parsed = parseSolarMemberRank(m.rank);
    setForm({
      id: m.id,
      name: m.name,
      rank: m.rank,
      role: parsed.role,
      adminSubType: parsed.adminSubType,
      game: parsed.game,
      avatar: m.avatar,
      bio: m.bio,
      socials: m.socials.map((s) => ({ ...s })),
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
            <Users size={18} className="text-[var(--accent)]" />
            {mb.title} ({members.length})
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {mb.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="dash-button dash-button-primary text-xs"
        >
          <Plus size={15} />
          {mb.addBtn}
        </button>
      </div>

      {error && !dialogOpen && (
        <p className="hub-error text-xs" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2.5" aria-busy="true" aria-label={mb.loadingAria}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 max-w-[60%]" />
                  <Skeleton className="h-3 w-24 max-w-[40%]" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--text-muted)]">
          {mb.emptyState}
        </div>
      ) : (
        <div className="space-y-2.5">
          {members.map((m, idx) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-xs font-bold text-[var(--text-muted)]">
                  #{idx + 1}
                </span>
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] flex items-center justify-center">
                  {m.avatar ? (
                    <Image
                      src={m.avatar}
                      alt={m.name}
                      width={44}
                      height={44}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={18} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-[var(--text)] truncate">
                      {m.name}
                    </strong>
                    <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                      {translateSolarRank(m.rank, locale)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {m.socials.length} {mb.linkedSocialsSuffix}
                    {m.bio ? ` · ${m.bio.slice(0, 60)}${m.bio.length > 60 ? "..." : ""}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={busy || idx === 0}
                  onClick={() => void handleMove(m.id, "up")}
                  aria-label={mb.moveUp}
                  className="dash-icon-button"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  disabled={busy || idx === members.length - 1}
                  onClick={() => void handleMove(m.id, "down")}
                  aria-label={mb.moveDown}
                  className="dash-icon-button"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openEdit(m)}
                  className="dash-button text-xs"
                >
                  <Edit3 size={14} />
                  {mb.editBtn}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDelete(m.id)}
                  className="dash-button dash-danger text-xs"
                >
                  <Trash2 size={14} />
                  {mb.deleteBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <DetailsDialog
          title={form.id ? mb.editDialogTitle.replace("{name}", form.name) : mb.addDialogTitle}
          onClose={() => setDialogOpen(false)}
          style={{ width: "min(640px, calc(100vw - 24px))" }}
        >
          <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto" dir={dir}>
            {error && (
              <p className="hub-error text-xs" role="alert">
                {error}
              </p>
            )}

            {/* Avatar Upload + URL */}
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-[var(--border)] bg-black/20 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] flex items-center justify-center">
                {form.avatar ? (
                  <Image
                    src={form.avatar}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={24} className="text-[var(--text-muted)]" />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="dash-button text-xs cursor-pointer">
                    <Upload size={14} />
                    {uploading ? mb.uploading : mb.uploadAvatar}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleUploadAvatar}
                      className="hidden"
                    />
                  </label>
                  {form.avatar && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, avatar: "" }))}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      {mb.removeAvatar}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.avatar}
                  onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.value }))}
                  placeholder={mb.avatarUrlPlaceholder}
                  dir="ltr"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5 text-xs">
                <span className="font-semibold text-[var(--text)]">{mb.nameLabel}</span>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={mb.namePlaceholder}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>

              <label className="block space-y-1.5 text-xs">
                <span className="font-semibold text-[var(--text)]">{mb.rankLabel}</span>
                <input
                  type="text"
                  required
                  value={form.rank}
                  onChange={(e) => setForm((p) => ({ ...p, rank: e.target.value }))}
                  placeholder={mb.rankPlaceholder}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
            </div>

            {/* Hierarchical Role / Rank / Game Selection */}
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-black/20 p-4">
              <label className="block space-y-1.5 text-xs">
                <span className="font-semibold text-[var(--text)]">{mb.roleSelectLabel}</span>
                <select
                  value={form.role}
                  onChange={(e) => {
                    const nextRole = e.target.value;
                    const nextSub = nextRole === "admin" ? form.adminSubType : "";
                    const nextGame = roleNeedsGame(nextRole, nextSub) ? form.game : "";
                    const formatted = formatSolarMemberRank(nextRole, nextSub, nextGame);
                    setForm((p) => ({
                      ...p,
                      role: nextRole,
                      adminSubType: nextSub,
                      game: nextGame,
                      rank: formatted || p.rank,
                    }));
                  }}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  <option value="">{mb.roleSelectPlaceholder}</option>
                  {SOLAR_MEMBER_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {translateSolarRank(r.label, locale)}
                    </option>
                  ))}
                </select>
              </label>

              {form.role === "admin" && (
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-[var(--text)]">
                    {mb.adminSubSelectLabel}
                  </span>
                  <select
                    value={form.adminSubType}
                    onChange={(e) => {
                      const nextSub = e.target.value;
                      const nextGame = roleNeedsGame(form.role, nextSub) ? form.game : "";
                      const formatted = formatSolarMemberRank(form.role, nextSub, nextGame);
                      setForm((p) => ({
                        ...p,
                        adminSubType: nextSub,
                        game: nextGame,
                        rank: formatted || p.rank,
                      }));
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
                  >
                    <option value="">{mb.adminSubSelectPlaceholder}</option>
                    {SOLAR_MEMBER_ADMIN_SUBTYPES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {translateSolarRank(s.label, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {roleNeedsGame(form.role, form.adminSubType) && (
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-[var(--text)]">
                    {mb.gameSelectLabel}
                  </span>
                  <select
                    value={form.game}
                    onChange={(e) => {
                      const nextGame = e.target.value;
                      const formatted = formatSolarMemberRank(
                        form.role,
                        form.adminSubType,
                        nextGame,
                      );
                      setForm((p) => ({
                        ...p,
                        game: nextGame,
                        rank: formatted || p.rank,
                      }));
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
                  >
                    <option value="">{mb.gameSelectPlaceholder}</option>
                    {SOLAR_MEMBER_GAMES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {translateSolarRank(g.optionLabel, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <label className="block space-y-1.5 text-xs">
              <span className="font-semibold text-[var(--text)]">{mb.bioLabel}</span>
              <textarea
                rows={2}
                maxLength={600}
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder={mb.bioPlaceholder}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
              />
            </label>

            {/* Social Accounts */}
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text)]">
                  {mb.socialsLabel}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      socials: [
                        ...p.socials,
                        { platform: "youtube", label: "", url: "" },
                      ],
                    }))
                  }
                  className="dash-button text-xs"
                >
                  <Plus size={13} />
                  {mb.addSocialBtn}
                </button>
              </div>

              {form.socials.length === 0 ? (
                <p className="text-[11px] text-[var(--text-muted)]">
                  {mb.noSocials}
                </p>
              ) : (
                <div className="space-y-2">
                  {form.socials.map((s, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-[120px_130px_1fr_auto] gap-2 items-center"
                    >
                      <select
                        value={s.platform}
                        onChange={(e) => {
                          const val = e.target.value as SolarMemberSocialPlatform;
                          setForm((p) => ({
                            ...p,
                            socials: p.socials.map((item, i) =>
                              i === idx ? { ...item, platform: val } : item,
                            ),
                          }));
                        }}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
                      >
                        {SOLAR_MEMBER_SOCIAL_PLATFORMS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={s.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((p) => ({
                            ...p,
                            socials: p.socials.map((item, i) =>
                              i === idx ? { ...item, label: val } : item,
                            ),
                          }));
                        }}
                        placeholder={mb.socialPlaceholder}
                        dir="ltr"
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
                      />

                      <input
                        type="url"
                        required
                        value={s.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((p) => ({
                            ...p,
                            socials: p.socials.map((item, i) =>
                              i === idx ? { ...item, url: val } : item,
                            ),
                          }));
                        }}
                        placeholder="https://..."
                        dir="ltr"
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            socials: p.socials.filter((_, i) => i !== idx),
                          }))
                        }
                        aria-label={mb.deleteSocialAria}
                        className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="dash-button text-xs"
              >
                {mb.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={busy || uploading}
                className="dash-button dash-button-primary text-xs"
              >
                {busy ? mb.saving : mb.saveBtn}
              </button>
            </div>
          </form>
        </DetailsDialog>
      )}
    </div>
  );
}
