"use client";
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
} from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
type Profile = {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  bannedUntil: string | null;
  banReason: string;
  deletedAt: string | null;
};
export default function MemberProfiles({
  onExpired,
}: {
  onExpired: () => void;
}) {
  const t = useTranslations("account"),
    h = useTranslations("hub"),
    locale = useLocale();
  const [profiles, setProfiles] = useState<Profile[]>([]),
    [query, setQuery] = useState(""),
    [version, setVersion] = useState(0),
    [selected, setSelected] = useState<Profile | null>(null),
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
                  <h3>{p.name}</h3>
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
              <textarea name="reason" maxLength={500} rows={3} />
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
