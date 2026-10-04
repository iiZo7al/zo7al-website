import type { HubContent } from "@/components/hub/ContentFeed";
export type RequestRow = { id:string; kind:"application"|"support"|"event"; payload:Record<string,unknown>; status:string; note:string; createdAt:string; discordReceipt:string|null };
export type OrderRow = { id:string; username:string; items:{ packageId:number; quantity:number }[]; createdAt:string; discordReceipt:string|null };
export type DashboardData = { content:HubContent[]; requests:RequestRow[]; orders:OrderRow[] };
export type ManagementTab = "news"|"event"|"rule"|"application"|"support"|"registrations"|"orders";
export const emptyDashboard: DashboardData = { content:[], requests:[], orders:[] };
export type Mutate = (action:"content"|"delete"|"review"|"retryDiscord",value:unknown) => Promise<boolean>;
