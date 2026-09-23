"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { MINECRAFT_SERVER } from "@/lib/data/minecraft";
import { flashCursor } from "@/components/cursor/CustomCursor";
import MagneticButton from "@/components/cursor/MagneticButton";

function CopyRow({
  label,
  address,
  disabledNote,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  address: string | null;
  disabledNote?: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      flashCursor(copiedLabel.toUpperCase(), 1200);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — no-op, address is still visible/selectable
    }
  };

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div>
        <p className="text-label mb-2">{label}</p>
        {address ? (
          <p className="font-mono text-lg sm:text-xl" dir="ltr">
            {address}
          </p>
        ) : (
          <p className="text-lg text-[var(--text-muted)]">{disabledNote}</p>
        )}
      </div>

      {address && (
        <MagneticButton>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`${copyLabel} — ${label}`}
            data-cursor="copy"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
            style={{
              background: copied ? "var(--accent)" : "transparent",
              color: copied ? "#07080B" : "var(--text)",
              border: copied ? "1px solid transparent" : "1px solid var(--border-strong)",
            }}
          >
            {copied ? (
              <>
                <Check size={14} strokeWidth={2.5} />
                {copiedLabel}
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={2.5} />
                {copyLabel}
              </>
            )}
          </button>
        </MagneticButton>
      )}
    </div>
  );
}

export default function ServerConnect() {
  const t = useTranslations("minecraft");
  const tc = useTranslations("common");
  return (
    <div className="grid gap-5">
      <CopyRow
        label={t("javaLabel")}
        address={MINECRAFT_SERVER.javaAddress}
        copyLabel={t("copyJava")}
        copiedLabel={tc("copied")}
      />
      <CopyRow
        label={t("bedrockLabel")}
        address={MINECRAFT_SERVER.bedrockAddress}
        copyLabel={t("copyBedrock")}
        copiedLabel={tc("copied")}
      />
      <CopyRow label={t("bedrockPort")} address={MINECRAFT_SERVER.bedrockPort} copyLabel={t("copyPort")} copiedLabel={tc("copied")} />
    </div>
  );
}

