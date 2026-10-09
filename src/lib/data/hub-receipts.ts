export type ReceiptKind = "order" | "application" | "support" | "event" | "gallery";
export type SavedReceipt = { kind: ReceiptKind; reference: string; token: string; savedAt: string; title?:string };
export const RECEIPT_KEY = "zo7al-private-receipts";
export function parseReceipts(value: string | null): SavedReceipt[] {
  try { const rows: unknown = JSON.parse(value ?? "[]"); if (!Array.isArray(rows)) return [];
    return rows.filter((row): row is SavedReceipt => !!row && typeof row === "object" && ["order","application","support","event"].includes(row.kind) && typeof row.reference === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.reference) && typeof row.token === "string" && /^[a-f0-9]{64}$/.test(row.token) && typeof row.savedAt === "string" && Number.isFinite(Date.parse(row.savedAt))).slice(0,30);
  } catch { return []; }
}
export function saveReceipt(kind: ReceiptKind, receipt: { reference: string; token: string }) {
  if (typeof window === "undefined" || !parseReceipts(JSON.stringify([{...receipt,kind,savedAt:new Date().toISOString()}])).length) return;
  try { const previous = parseReceipts(localStorage.getItem(RECEIPT_KEY)); localStorage.setItem(RECEIPT_KEY,JSON.stringify([{...receipt,kind,savedAt:new Date().toISOString()},...previous.filter(row=>row.reference!==receipt.reference)].slice(0,30))); window.dispatchEvent(new Event("zo7al-receipts")); } catch {}
}
