"use client";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ShieldBan, ShieldCheck } from "lucide-react";
type Server = {
  id: string;
  name: string;
  ban: {
    banned: boolean;
    reason: string | null;
    expiresAt: string | null;
    durationKnown: boolean;
  } | null;
  capturedAt: string | null;
  stale: boolean;
};
export default function MinecraftBans() {
  const t = useTranslations("account"),
    locale = useLocale();
  const [servers, setServers] = useState<Server[] | null>(null),
    [error, setError] = useState(false),
    [now, setNow] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    void fetch("/api/account/bans", { cache: "no-store", signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const data = await r.json();
        if (!c.signal.aborted) {
          setServers(data.servers);
          setNow(Date.now());
        }
      })
      .catch(() => {
        if (!c.signal.aborted) setError(true);
      });
    return () => c.abort();
  }, []);
  const format = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  return (
    <section className="account-card">
      <h2 className="flex items-center gap-3">
        <ShieldBan size={22} />
        {t("banStatus")}
      </h2>
      {error && (
        <p role="alert" className="account-error">
          {t("errors.UNAVAILABLE")}
        </p>
      )}
      <div className="minecraft-ban-list">
        {servers?.map((s) => {
          const active =
            s.ban?.banned &&
            (!s.ban.expiresAt || Date.parse(s.ban.expiresAt) > now);
          return (
            <article
              className={"minecraft-ban" + (active ? " is-banned" : "")}
              key={s.id}
            >
              <header>
                <strong>{s.name}</strong>
                {active ? <ShieldBan size={18} /> : <ShieldCheck size={18} />}
              </header>
              <p className="account-help">
                {!s.ban ? t("banUnknown") : active ? t("banned") : t("noBans")}
              </p>
              {active && (
                <>
                  <small>
                    {!s.ban!.durationKnown
                      ? t("durationUnknown")
                      : s.ban!.expiresAt
                        ? t("banUntil") + " " + format(s.ban!.expiresAt)
                        : t("permanent")}
                  </small>
                  {s.ban!.reason && (
                    <p className="account-help" dir="auto">
                      {t("banReason")}: {s.ban!.reason}
                    </p>
                  )}
                </>
              )}
              {s.stale && <small>{t("banStale")}</small>}
              {s.capturedAt && <small>{format(s.capturedAt)}</small>}
            </article>
          );
        })}
      </div>
      {!servers && !error && <p className="account-help">{t("loading")}</p>}
    </section>
  );
}
