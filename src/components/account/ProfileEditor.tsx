"use client";
import MarkdownTextarea from "@/components/ui/MarkdownTextarea";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, UserRound, ExternalLink } from "lucide-react";
import { PROFILE_SOCIALS,PROFILE_SOCIAL_LABELS } from "@/lib/data/member-profile";
import BrandIcon from "@/components/ui/BrandIcon";
import { useAccount, accountAction } from "./AccountProvider";
export default function ProfileEditor() {
  const common=useTranslations("common");
  const t = useTranslations("account"),
    { account, refresh } = useAccount();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [avatar, setAvatar] = useState(account?.avatar ?? ""),
    [banner, setBanner] = useState(account?.banner ?? "");
  if (!account) return null;
  async function upload(file: File | undefined, kind: "avatar" | "banner") {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("image", file);
      const response = await fetch("/api/account/media", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw Error();
      (kind === "avatar" ? setAvatar : setBanner)(data.url);
    } catch {
      setError(t("errors.UNAVAILABLE"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-card profile-editor">
      <h2>{t("publicProfile")}</h2>
      <p className="account-help">{t("profileIntro")}</p>
      <div className="profile-preview-banner">
        {banner && <Image unoptimized src={banner} fill alt="" />}
        <div className="profile-preview-avatar">
          {avatar ? (
            <Image unoptimized src={avatar} width={80} height={80} alt="" />
          ) : (
            <UserRound size={40} />
          )}
        </div>
      </div>
      <form
        className="hub-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const f = new FormData(event.currentTarget);
          setBusy(true);
          setError("");
          setMessage("");
          try {
            await accountAction("profile", {
              username: f.get("username"),
              avatar,
              banner,
              bio: f.get("bio"),
              socials: Object.fromEntries(
                PROFILE_SOCIALS.map((key) => [key, f.get(key)]),
              ),
            });
            await refresh();
            setMessage(t("profileSaved"));
          } catch (error) {
            setError(
              error instanceof Error && error.message === "USERNAME_TAKEN"
                ? t("errors.USERNAME_TAKEN")
                : t("errors.INVALID"),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {t("username")}
          <input
            name="username"
            dir="ltr"
            defaultValue={account.username ?? ""}
            required
            pattern="[a-zA-Z0-9_]{3,32}"
            minLength={3}
            maxLength={32}
            autoComplete="username"
            disabled={busy}
          />
          <small dir="ltr">zo7al.is-a.dev/@username</small>
        </label>
        <div className="profile-editor-images">
          {(["avatar", "banner"] as const).map((kind) => (
            <label key={kind}>
              {t(kind)}
              <input
                type="text"
                value={kind === "avatar" ? avatar : banner}
                onChange={(e) =>
                  (kind === "avatar" ? setAvatar : setBanner)(e.target.value)
                }
                placeholder={t("imageURL")}
                disabled={busy}
                dir="ltr"
              />
              <span className="profile-upload-label">
                <ImagePlus size={17} />
                {t("uploadImage")}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={busy}
                  onChange={(e) => void upload(e.target.files?.[0], kind)}
                />
              </span>
            </label>
          ))}
        </div>
        <label>
          {t("bio")}
          <MarkdownTextarea
            name="bio"
            defaultValue={account.bio}
            maxLength={500}
            rows={3}
            disabled={busy}
          />
        </label>
        <details className="profile-social-settings">
          <summary>{t("socialLinks")}</summary>
          <div className="hub-form mt-4">
            {PROFILE_SOCIALS.map((key) => (
              <label key={key}>
                <span className="flex items-center gap-2">
                  <BrandIcon slug={key} size={17} />
                  {key === "website"
                    ? common("website")
                    : PROFILE_SOCIAL_LABELS[key]??key}
                </span>
                <input
                  name={key}
                  type="url"
                  dir="ltr"
                  defaultValue={account.socials[key] ?? ""}
                  maxLength={1024}
                  disabled={busy}
                  placeholder="https://"
                />
              </label>
            ))}
          </div>
        </details>
        {message && (
          <p role="status" className="account-notice">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="account-error">
            {error}
          </p>
        )}
        <div className="hub-actions">
          <button className="hub-button hub-button-primary" disabled={busy}>
            {t("save")}
          </button>
          {account.username && (
            <Link href={"/@" + account.username} className="hub-button">
              <ExternalLink size={16} />
              {t("viewProfile")}
            </Link>
          )}
          <Link href="/requests?tab=gallery" className="hub-button">
            {t("submissions")}
          </Link>
        </div>
      </form>
    </section>
  );
}
