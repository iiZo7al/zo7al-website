"use client";

import { useEffect, useRef, useState, type TextareaHTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import MarkdownContent from "./MarkdownContent";

export default function MarkdownTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const t = useTranslations("common");
  const input = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(String(props.value ?? props.defaultValue ?? ""));
  const content = props.value === undefined ? draft : String(props.value);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => queueMicrotask(() => setDraft(input.current?.value ?? ""));
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);
  return <><textarea {...props} ref={input} onChange={event => { setDraft(event.target.value); props.onChange?.(event); }} /><small className="markdown-hint">{t("markdownHint")}</small>{content.trim() && <details className="markdown-preview"><summary>{t("markdownPreview")}</summary><MarkdownContent>{content}</MarkdownContent></details>}</>;
}
