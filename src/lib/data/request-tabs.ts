import type { ReceiptKind } from "./hub-receipts";

export const REQUEST_TABS = [
  { value: "orders", kind: "order", label: "orders", description: "ordersIntro" },
  { value: "applications", kind: "application", label: "applications", description: "applicationsIntro" },
  { value: "support", kind: "support", label: "support", description: "supportIntro" },
  { value: "events", kind: "event", label: "registrations", description: "eventsIntro" },
  { value: "gallery", kind: "gallery", label: "mySubmissions", description: "submissionsIntro" },
] as const;
export type RequestTab = typeof REQUEST_TABS[number]["value"];
export function requestTab(value: string | null | undefined): RequestTab {
  return REQUEST_TABS.find(tab => tab.value === value)?.value ?? "orders";
}
export function requestLink(kind: ReceiptKind) {
  return `/requests?tab=${REQUEST_TABS.find(tab => tab.kind === kind)!.value}`;
}
