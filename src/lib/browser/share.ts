/** Copy inside native dialogs and fall back when Clipboard API is denied. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* Some browsers allow the legacy action instead. */ }
  const focused = document.activeElement as HTMLElement | null;
  const field = document.createElement("textarea");
  field.value = text; field.readOnly = true;
  field.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;";
  (focused?.closest("dialog[open]") ?? document.body).appendChild(field);
  let copied = false;
  try { field.focus(); field.select(); field.setSelectionRange(0, text.length); copied = document.execCommand("copy"); }
  catch { /* The caller offers a selectable link if both methods fail. */ }
  finally { field.remove(); focused?.focus({ preventScroll: true }); }
  return copied;
}
export async function shareLink(url: string, title: string): Promise<"shared" | "copied" | "cancelled" | "manual"> {
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ url, title }))) { await navigator.share({ url, title }); return "shared"; }
  } catch (error) { if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return "cancelled"; }
  return await copyText(url) ? "copied" : "manual";
}
