"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { UserRound } from "lucide-react";
import { useAccount, accountAction } from "./AccountProvider";
import { useState } from "react";
import AccountIdentityIcon from "./AccountIdentityIcon";
export default function SubmissionIdentity({ next }: { next: string }) {
  const t = useTranslations("account"),
    { account, providers } = useAccount(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!account) return null;
  const discord = account.providers.find((p) => p.provider === "discord");
  return (
    <div className="submission-identity">
      <div className="submission-identity-person">
        {account.avatar ? (
          <Image
            unoptimized
            src={account.avatar}
            width={48}
            height={48}
            alt=""
          />
        ) : (
          <UserRound size={30} />
        )}
        <div>
          <strong>{account.name}</strong>
          {account.username && <small dir="ltr">@{account.username}</small>}
        </div>
      </div>
      <div className="submission-discord">
        <AccountIdentityIcon provider="discord" size={20} />
        {discord ? (
          <span>{discord.name ?? t("connected")}</span>
        ) : (
          <button
            type="button"
            className="hub-button"
            disabled={busy || !providers.includes("discord")}
            onClick={async () => {
              setBusy(true);
              try {
                const data = await accountAction("link", {
                  provider: "discord",
                  next,
                });
                if (data.url) window.location.assign(data.url);
              } catch {
                setError(t("errors.PROVIDER"));
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("linkDiscord")}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="account-error">
          {error}
        </p>
      )}
    </div>
  );
}
