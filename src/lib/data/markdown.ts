/** Only normal web, email and local links are allowed in authored content. */
export function markdownUrl(value: string, image = false): string {
  const url = value.trim();
  if (!url || /[\u0000-\u0020\u007f\\]/.test(url)) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (!image && (url.startsWith("#") || url.startsWith("?"))) return url;
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return "";
    if (parsed.protocol === "https:" || (!image && ["http:", "mailto:"].includes(parsed.protocol))) return url;
  } catch { /* Invalid and protocol-relative URLs are omitted. */ }
  return "";
}

/** Preserve Markdown while converting legacy provider HTML into readable text. */
export function markdownSource(value: string): string {
  return value.replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(?:p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]*>/g, tag => /^<https?:\/\/[^>]+>$/.test(tag) ? tag : "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
