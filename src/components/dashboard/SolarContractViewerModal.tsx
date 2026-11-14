"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Download, ExternalLink, FileCheck, PenTool } from "lucide-react";
import "@/components/store/store.css";

export default function SolarContractViewerModal({
  isOpen,
  onClose,
  signatureUrl,
  applicantName,
  isLeave = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  signatureUrl: string;
  applicantName: string;
  isLeave?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"contract" | "signature">("contract");
  const [downloading, setDownloading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!isOpen) {
      dialogRef.current?.close();
      return;
    }
    dialogRef.current?.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const contractAsset = isLeave
    ? "/assets/site/solar-leave-pledge.png"
    : "/assets/site/solar-contract-pledge.png";

  const handleDownloadMerged = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 716;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      // Load contract background
      const baseImg = new window.Image();
      baseImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        baseImg.onload = () => resolve();
        baseImg.onerror = reject;
        baseImg.src = contractAsset;
      });
      ctx.drawImage(baseImg, 0, 0, 716, 1024);

      // Load signature image
      const sigImg = new window.Image();
      sigImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        sigImg.onload = () => resolve();
        sigImg.onerror = reject;
        sigImg.src = signatureUrl;
      });

      // Target area: left 8% (57px), top 80% (819px), width 54% (386px), height 12% (123px)
      const targetX = 57;
      const targetY = 819;
      const targetW = 386;
      const targetH = 123;

      // Fit contained
      const sigAspect = (sigImg.naturalWidth || 1) / (sigImg.naturalHeight || 1);
      const targetAspect = targetW / targetH;
      let drawW = targetW;
      let drawH = targetH;
      let drawX = targetX;
      let drawY = targetY;

      if (sigAspect > targetAspect) {
        drawW = targetW;
        drawH = targetW / sigAspect;
        drawY = targetY + (targetH - drawH) / 2;
      } else {
        drawH = targetH;
        drawW = targetH * sigAspect;
        drawX = targetX + (targetW - drawW) / 2;
      }

      ctx.drawImage(sigImg, drawX, drawY, drawW, drawH);

      const link = document.createElement("a");
      link.download = `${isLeave ? "solar-leave-contract" : "solar-contract"}-${applicantName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      window.open(signatureUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSignatureOnly = () => {
    const link = document.createElement("a");
    link.download = `solar-signature-${applicantName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_")}.png`;
    link.href = signatureUrl;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="solar-contract-viewer-title"
      className="checkout-shell store-checkout max-w-2xl"
    >
      {/* Header matching site modals */}
      <header className="store-checkout-header" dir="rtl">
        <div className="store-checkout-brand">
          <span className="store-rank-icon">
            <FileCheck size={20} />
          </span>
          <div>
            <h3 id="solar-contract-viewer-title" className="font-semibold text-base text-[var(--text)]">
              {isLeave
                ? `معاينة عقد الإجازة والتوقيع — ${applicantName}`
                : `معاينة العقد والتوقيع — ${applicantName}`}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              اختر بين عرض التوقيع داخل العقد بمكانه المعتمد أو استعراض التوقيع منفرداً.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="store-close"
          aria-label="إغلاق"
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      {/* Body matching site modals */}
      <div className="store-checkout-body space-y-5" dir="rtl">
        {/* Tab Controls */}
        <div className="flex items-center justify-center gap-2 border-b border-[var(--border)] pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("contract")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "contract"
                ? "bg-[var(--accent)] text-[#07080b] shadow-md shadow-[var(--accent)]/20"
                : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--surface)]"
            }`}
          >
            <FileCheck size={15} />
            بالعقد (مكانه داخل العقد)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("signature")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "signature"
                ? "bg-[var(--accent)] text-[#07080b] shadow-md shadow-[var(--accent)]/20"
                : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--surface)]"
            }`}
          >
            <PenTool size={15} />
            التوقيع لحاله
          </button>
        </div>

        {/* View 1: Inside Contract */}
        {activeTab === "contract" && (
          <div className="space-y-4">
            <div className="relative mx-auto max-w-[400px] aspect-[716/1024] overflow-hidden rounded-xl border border-[var(--border)] shadow-xl bg-black">
              {/* Background Contract */}
              <Image
                src={contractAsset}
                alt={isLeave ? "عقد الإجازة الرسمي لفريق Solar" : "وثيقة تعهد وعقد مقدّم Solar"}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 400px"
              />

              {/* Signature Overlay Placed Exactly inside Contract */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: "8%",
                  top: "80%",
                  width: "54%",
                  height: "12%",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureUrl}
                  alt={`توقيع ${applicantName}`}
                  className="h-full w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                />
              </div>
            </div>

            <p className="text-center text-xs text-[var(--text-muted)]">
              يظهر التوقيع الرقمي في المكان المخصص له داخل وثيقة العقد الرسمية.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadMerged}
                className="store-action store-action-primary"
              >
                <Download size={14} />
                {downloading ? "جاري تجهيز الصورة..." : "تحميل العقد مع التوقيع (PNG)"}
              </button>

              <a
                href={signatureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="store-action"
              >
                <ExternalLink size={14} />
                فتح التوقيع الأصلي
              </a>
            </div>
          </div>
        )}

        {/* View 2: Signature Alone */}
        {activeTab === "signature" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-64 max-w-md items-center justify-center rounded-xl border border-[var(--border)] bg-zinc-950 p-6 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signatureUrl}
                alt={`توقيع ${applicantName}`}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(255,138,0,0.2)]"
              />
            </div>

            <p className="text-center text-xs text-[var(--text-muted)]">
              التوقيع الرقمي المرفوع أو المرسوم بواسطة المتقدم.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadSignatureOnly}
                className="store-action store-action-primary"
              >
                <Download size={14} />
                تحميل التوقيع فقط (PNG)
              </button>

              <a
                href={signatureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="store-action"
              >
                <ExternalLink size={14} />
                فتح برابط مباشر
              </a>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
