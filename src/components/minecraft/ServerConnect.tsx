"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { MINECRAFT_SERVER } from "@/lib/data/minecraft";
import { flashCursor } from "@/components/cursor/CustomCursor";
import DetailsDialog from "@/components/ui/DetailsDialog";
import DetailsIcon from "@/components/ui/DetailsIcon";
import MagneticButton from "@/components/cursor/MagneticButton";

function CopyRow({
  label,
  address,
  subtitle,
  detailsLabel,
  onDetails,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  address: string | null;
  subtitle?: string;
  detailsLabel: string;
  onDetails: () => void;
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
      className="card-glow flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div>
        <p className="text-label mb-2">{label}</p>
        {address ? (
          <p className="font-mono text-lg sm:text-xl" dir="ltr">
            {address}
          </p>
        ) : (
          <p className="text-lg text-[var(--text-muted)]">—</p>
        )}
        {subtitle && <p className="mt-2 text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </div>

      {address && (
        <div className="flex items-center gap-3">
        <button type="button" onClick={onDetails} aria-label={detailsLabel} title={detailsLabel} aria-haspopup="dialog" className="inline-flex size-12 items-center justify-center rounded-full border border-[var(--border-strong)] transition-colors hover:text-[var(--accent)]"><DetailsIcon /></button>
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
        </div>
      )}
    </div>
  );
}

export default function ServerConnect() {
  const t = useTranslations("minecraft");
  const tc = useTranslations("common");
  const [tutorial, setTutorial] = useState<"java" | "bedrock" | null>(null);
  return (
    <div className="grid gap-5">
      <CopyRow label={t("sharedAddress")} address={MINECRAFT_SERVER.javaAddress}
        copyLabel={tc("copy")} copiedLabel={tc("copied")}
        detailsLabel={t("javaTutorial")} onDetails={() => setTutorial("java")} />
      <CopyRow label={t("portLabel")} subtitle="Bedrock" address={MINECRAFT_SERVER.bedrockPort}
        copyLabel={t("copyPort")} copiedLabel={tc("copied")}
        detailsLabel={t("bedrockTutorial")} onDetails={() => setTutorial("bedrock")} />
      {tutorial && <DetailsDialog title={t(tutorial === "java" ? "javaTutorial" : "bedrockTutorial")} onClose={() => setTutorial(null)}>
        <div className="space-y-5 p-5 sm:p-7">
          {tutorial === "bedrock" && <p className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] p-4 text-sm text-[var(--accent)]">{t("bedrockPortNotice", { port: MINECRAFT_SERVER.bedrockPort })}</p>}
          <video key={tutorial} controls playsInline preload="metadata" poster={`/assets/tutorials/${tutorial}.jpg`} className="aspect-video w-full rounded-2xl bg-black">
            <source src={`/assets/tutorials/${tutorial}.mp4`} type="video/mp4" />
          </video>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">{t(tutorial === "java" ? "javaInstructions" : "bedrockInstructions", { address: MINECRAFT_SERVER.javaAddress, port: MINECRAFT_SERVER.bedrockPort })}</p>
          <p className="rounded-xl border border-[var(--border)] p-4 font-mono text-sm" dir="ltr">{MINECRAFT_SERVER.javaAddress}{tutorial === "bedrock" && <span className="mt-2 block">{t("portLabel")}: {MINECRAFT_SERVER.bedrockPort}</span>}</p>
        </div>
      </DetailsDialog>}
    </div>
  );
}
