"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Trash2, LoaderCircle } from "lucide-react";
import ContentImage from "@/components/hub/ContentImage";
import { CONTENT_IMAGE_SOURCE_BYTES, CONTENT_IMAGE_UPLOAD_BYTES, contentImageId, type ContentImage as StoredImage } from "@/lib/data/content-media";

async function prepareImage(file: File): Promise<Blob> {
  if (!file.size || file.size > CONTENT_IMAGE_SOURCE_BYTES) throw Error("imageTooLarge");
  if (!/^(image\/(png|jpeg|webp|avif|gif))$/.test(file.type) && !(file.type === "" && /\.(png|jpe?g|webp|avif|gif)$/i.test(file.name))) throw Error("imageInvalid");
  const url = URL.createObjectURL(file), image = new window.Image();
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(Error("imageInvalid")); image.src = url; });
    if (!image.naturalWidth || !image.naturalHeight) throw Error("imageInvalid");
    const scale = Math.min(1, 4096 / image.naturalWidth, 4096 / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d"); if (!context) throw Error("imageInvalid");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.78, 0.65]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= CONTENT_IMAGE_UPLOAD_BYTES) return blob;
    }
    throw Error("imageTooLarge");
  } finally { URL.revokeObjectURL(url); }
}

export default function ContentImageField({ initial, disabled, onBusy }: { initial?: StoredImage | null; disabled: boolean; onBusy: (busy: boolean) => void }) {
  const t = useTranslations("hub");
  const [image, setImage] = useState<StoredImage | null>(initial ?? null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null), controller = useRef<AbortController | null>(null), mounted = useRef(false), lock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const upload = async (file?: File) => {
    if (!file || disabled || lock.current) return; lock.current = true; setBusy(true); onBusy(true); setError("");
    controller.current = new AbortController();
    try {
      const blob = await prepareImage(file); if (!mounted.current) return;
      const form = new FormData(); form.append("image", blob, "cover.webp");
      const response = await fetch("/api/admin/hub/media", { method: "POST", body: form, signal: controller.current.signal });
      const result = await response.json();
      if (!response.ok) throw Error(result.error === "IMAGE_SIZE" ? "imageTooLarge" : result.error === "IMAGE_FORMAT" ? "imageInvalid" : result.error === "RATE_LIMIT" ? "rateLimit" : "imageUploadFailed");
      if (!contentImageId(result.image?.id) || !Number.isInteger(result.image.width) || !Number.isInteger(result.image.height)) throw Error("imageUploadFailed");
      if (mounted.current) setImage(result.image);
    } catch (error) { if (mounted.current && !controller.current?.signal.aborted) setError(error instanceof Error ? error.message : "imageUploadFailed"); }
    finally { lock.current = false; if (mounted.current) { setBusy(false); onBusy(false); } }
  };
  return <fieldset className="dash-image-field" disabled={disabled || busy}><legend>{t("coverImage")}</legend>
    <input type="hidden" name="imageId" value={image?.id ?? ""} />
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" className="pelican-file-input" aria-label={t("uploadImage")} tabIndex={-1} onChange={event => { void upload(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
    <ContentImage image={image} title={t("imagePreview")} />
    {image && <p className="dash-help" dir="ltr">{image.width} × {image.height}</p>}
    <p className="dash-help">{t("imageHint")}</p>
    <div className="dash-actions"><button type="button" className="dash-button" onClick={() => input.current?.click()}>{busy ? <LoaderCircle size={16} className="dash-spinning" /> : <ImagePlus size={16} />}{t(busy ? "uploadingImage" : image ? "replaceImage" : "uploadImage")}</button>{image && <button type="button" className="dash-icon-button dash-danger" aria-label={t("removeImage")} title={t("removeImage")} onClick={() => { setImage(null); setError(""); }}><Trash2 size={17} /></button>}</div>
    {error && <p className="hub-error" role="alert">{t.has(error) ? t(error) : t("imageUploadFailed")}</p>}
  </fieldset>;
}
