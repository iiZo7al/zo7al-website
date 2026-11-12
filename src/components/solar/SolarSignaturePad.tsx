"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Download, Upload, Trash2, CheckCircle2, PenTool } from "lucide-react";

export default function SolarSignaturePad({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<"upload" | "draw">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Setup canvas
  useEffect(() => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#FF8A00";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/solar/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setUploadError(
          data.error === "AUTH_REQUIRED"
            ? "يجب تسجيل الدخول أولاً لرفع الصورة."
            : "حدث خطأ أثناء رفع الصورة، يرجى التأكد من حجم وصيغة الصورة."
        );
        return;
      }
      onChange(data.url);
    } catch {
      setUploadError("تعذر الاتصال بالخادم لرفع الصورة.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDrawnSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    setUploading(true);
    setUploadError(null);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const res = await fetch("/api/solar/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setUploadError("تعذر حفظ التوقيع، يرجى المحاولة مجدداً.");
        return;
      }
      onChange(data.url);
    } catch {
      setUploadError("تعذر حفظ التوقيع.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-black/20 p-4">
      {/* Contract Download Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded border border-[var(--border)] bg-black">
            <Image
              src="/assets/site/solar-contract-pledge.png"
              alt="عقد Solar"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text)]">
              صورة عقد وتعهد كلان Solar System
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              قم بتحميل الصورة للتوقيع عليها عبر أي تطبيق تعديل صور
            </p>
          </div>
        </div>

        <a
          href="/assets/site/solar-contract-pledge.png"
          download="عقد_كلان_سولار.png"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shrink-0"
        >
          <Download size={14} />
          تنزيل صورة العقد
        </a>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
            mode === "upload"
              ? "bg-[var(--accent)] text-[#07080b] font-semibold"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <Upload size={13} />
          رفع الصورة الموقّعة
        </button>

        <button
          type="button"
          onClick={() => setMode("draw")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
            mode === "draw"
              ? "bg-[var(--accent)] text-[#07080b] font-semibold"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <PenTool size={13} />
          أو وقّع رقمياً هنا
        </button>
      </div>

      {/* Upload Mode */}
      {mode === "upload" && (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center cursor-pointer hover:border-[var(--accent)] transition-colors">
            <Upload size={24} className="text-[var(--accent)] mb-2 opacity-80" />
            <span className="text-xs font-medium text-[var(--text)]">
              انقر لاختيار ورفع صورة العقد بعد إضافة توقيعك
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1">
              يدعم PNG, JPG, WebP (بحد أقصى 5 ميجابايت)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadFile}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Draw Mode */}
      {mode === "draw" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>ارسم توقيعك داخل المربع أدناه (بالفأرة أو اللمس):</span>
            {hasDrawn && (
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1 text-rose-400 hover:underline"
              >
                <Trash2 size={12} />
                مسح
              </button>
            )}
          </div>

          <div className="relative rounded-xl border border-[var(--border)] bg-[#0c0d12] overflow-hidden">
            <canvas
              ref={canvasRef}
              width={460}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[140px] touch-none cursor-crosshair"
            />
          </div>

          {hasDrawn && (
            <button
              type="button"
              onClick={handleSaveDrawnSignature}
              disabled={uploading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
            >
              {uploading ? "جاري حفظ التوقيع..." : "اعتماد وحفظ هذا التوقيع"}
            </button>
          )}
        </div>
      )}

      {/* Uploading indicator */}
      {uploading && (
        <p className="text-xs text-[var(--accent)] animate-pulse text-center">
          جاري معالجة ورفع صورة التوقيع...
        </p>
      )}

      {/* Error message */}
      {uploadError && (
        <p className="text-xs text-red-400 text-center">{uploadError}</p>
      )}

      {/* Confirmed Value */}
      {value && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>تم إرفاق صورة التوقيع بنجاح</span>
          </div>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] underline hover:text-emerald-300"
          >
            معاينة التوقيع
          </a>
        </div>
      )}
    </div>
  );
}
