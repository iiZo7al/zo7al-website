"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

/** Native top-layer dialog: keyboard focus, Escape and focus restoration. */
export default function DetailsDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const t = useTranslations("store");
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={dialog} className="site-details" aria-labelledby={titleId} onCancel={onClose} onClose={onClose} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
  }}>
    <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] p-5 sm:px-7">
      <h2 id={titleId} className="font-semibold">{title}</h2>
      <button type="button" autoFocus onClick={onClose} aria-label={t("close")} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] transition-colors hover:bg-[var(--surface-raised)]"><X size={18} /></button>
    </header>
    {children}
  </dialog>;
}
