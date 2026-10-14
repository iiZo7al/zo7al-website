"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Fingerprint, Plus, Trash2, LoaderCircle, ArrowRight } from "lucide-react";
import { useAccount } from "./AccountProvider";
type Passkey = { id: string; friendly_name?: string; created_at: string };
type Descriptor = {
  id: string;
  type: PublicKeyCredentialType;
  transports?: AuthenticatorTransport[];
};
type Options = {
  challenge: string;
  user?: { id: string; name: string; displayName: string };
  excludeCredentials?: Descriptor[];
  allowCredentials?: Descriptor[];
  [key: string]: unknown;
};
const bytes = (value: string) =>
  Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  ).buffer;
const encoded = (value: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
async function action(action: string, input: Record<string, unknown> = {}) {
  const response = await fetch("/api/account/passkeys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...input }),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error ?? "UNAVAILABLE");
  return data;
}
async function ceremony(register: boolean) {
  if (!window.PublicKeyCredential || !navigator.credentials)
    throw Error("PASSKEY_UNAVAILABLE");
  const data = await action(register ? "register-start" : "signin-start"),
    options = data.options as Options;
  const common = { ...options, challenge: bytes(options.challenge) };
  let credential: PublicKeyCredential | null;
  if (register) {
    if (!options.user) throw Error("INVALID");
    credential = (await navigator.credentials.create({
      publicKey: {
        ...common,
        user: { ...options.user, id: bytes(options.user.id) },
        excludeCredentials: options.excludeCredentials?.map((c) => ({
          ...c,
          id: bytes(c.id),
        })),
      } as PublicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;
  } else
    credential = (await navigator.credentials.get({
      publicKey: {
        ...common,
        allowCredentials: options.allowCredentials?.map((c) => ({
          ...c,
          id: bytes(c.id),
        })),
      } as PublicKeyCredentialRequestOptions,
    })) as PublicKeyCredential | null;
  if (!credential) throw Error("PASSKEY_CANCELLED");
  let serialized: unknown;
  if ("toJSON" in credential && typeof credential.toJSON === "function")
    serialized = credential.toJSON();
  else {
    const response = credential.response;
    const fields: Record<string, unknown> = {
      clientDataJSON: encoded(response.clientDataJSON),
    };
    if (register) {
      const attestation = response as AuthenticatorAttestationResponse;
      fields.attestationObject = encoded(attestation.attestationObject);
      fields.transports = attestation.getTransports?.();
    } else {
      const assertion = response as AuthenticatorAssertionResponse;
      fields.authenticatorData = encoded(assertion.authenticatorData);
      fields.signature = encoded(assertion.signature);
      fields.userHandle = assertion.userHandle
        ? encoded(assertion.userHandle)
        : undefined;
    }
    serialized = {
      id: credential.id,
      rawId: encoded(credential.rawId),
      type: "public-key",
      response: fields,
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
    };
  }
  return action(register ? "register-verify" : "signin-verify", {
    challengeId: data.challenge_id,
    credential: serialized,
  });
}
export function PasskeySignin({
  onComplete,
}: {
  onComplete: (mfaRequired: boolean) => void;
}) {
  const t = useTranslations("account"),
    { passkeyEnabled, refresh } = useAccount(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!passkeyEnabled) return null;
  return (
    <div className="account-provider-buttons">
      <button
        type="button"
        className="hub-button account-provider-button account-passkey-signin"
        data-cursor="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const result = await ceremony(false);
            await refresh();
            onComplete(result.mfaRequired === true);
          } catch {
            setError(t("passkeyCancelled"));
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="account-provider-icon" aria-hidden="true">
          {busy ? (
            <LoaderCircle size={22} className="animate-spin" />
          ) : (
            <Fingerprint size={22} />
          )}
        </span>
        <span>{t("signinPasskey")}</span>
        <ArrowRight size={16} className="account-provider-arrow" aria-hidden="true" />
      </button>
      {error && (
        <p role="alert" className="account-error mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
export default function AccountPasskeys() {
  const t = useTranslations("account"),
    { passkeyEnabled } = useAccount();
  const [keys, setKeys] = useState<Passkey[]>([]),
    [busy, setBusy] = useState(false),
    [version, setVersion] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    if (!passkeyEnabled) return;
    const c = new AbortController();
    void fetch("/api/account/passkeys", { cache: "no-store", signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const data = await r.json();
        if (!c.signal.aborted)
          setKeys(Array.isArray(data.passkeys) ? data.passkeys : []);
      })
      .catch(() => {
        if (!c.signal.aborted) setError(t("passkeyUnavailable"));
      });
    return () => c.abort();
  }, [passkeyEnabled, version, t]);
  return (
    <section className="account-card">
      <h2 className="flex items-center gap-3">
        <Fingerprint size={24} />
        {t("passkeys")}
      </h2>
      <p className="account-help">{t("passkeyIntro")}</p>
      {!passkeyEnabled ? (
        <p className="account-help mt-4">{t("passkeyUnavailable")}</p>
      ) : (
        <>
          <div className="account-connections mt-5">
            {keys.map((key) => (
              <div key={key.id} className="account-connection">
                <Fingerprint size={22} />
                <span>{key.friendly_name ?? t("passkeys")}</span>
                <button
                  type="button"
                  className="hub-button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await action("delete", { id: key.id });
                      setVersion((v) => v + 1);
                    } catch {
                      setError(t("errors.UNAVAILABLE"));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Trash2 size={16} />
                  {t("removePasskey")}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="hub-button mt-5"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await ceremony(true);
                setVersion((v) => v + 1);
              } catch {
                setError(t("passkeyCancelled"));
              } finally {
                setBusy(false);
              }
            }}
          >
            <Plus size={17} />
            {t("addPasskey")}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="account-error mt-4">
          {error}
        </p>
      )}
    </section>
  );
}
