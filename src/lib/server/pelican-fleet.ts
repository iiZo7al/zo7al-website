import "server-only";
import type { ConnectionInput } from "../data/dashboard";
import { parsePelicanServer, parsePelicanStats, type PelicanStats } from "../data/pelican";
import { object, collection, string } from "../data/pelican-management";
import { pelicanRequest } from "./pelican";

export async function pelicanFleet(connection: ConnectionInput, page: number, search: string, scope: "all" | "owner" | "other") {
  const query = { page: String(page), per_page: "12", ...(search ? { "filter[name]": search } : {}) };
  const list = (type?: string) => pelicanRequest(connection, "", undefined, { client: true, method: "GET", timeoutMs: 8000, query: { ...query, ...(type ? { type } : {}) } });
  let value: unknown;
  if (scope === "all" || scope === "other") {
    // Root-admin keys can see the entire panel. Other keys retain their direct access.
    const [direct, admin] = await Promise.allSettled([list(), list("admin-all")]);
    if (admin.status === "fulfilled" && Number(object(object(object(admin.value).meta).pagination).total) > 0) value = admin.value;
    else if (direct.status === "fulfilled") value = direct.value;
    else throw direct.reason;
  } else value = await list(scope === "owner" ? "owner" : undefined);
  if (!Array.isArray(object(value).data)) throw Error("INVALID_UPSTREAM");
  const items = collection(value).slice(0, 12).filter(row => scope !== "other" || row.server_owner !== true).map(row => ({
    ...parsePelicanServer({ attributes: row }), description: string(row.description).slice(0, 500), node: string(row.node).slice(0, 120),
    owned: row.server_owner === true, suspended: row.is_suspended === true || row.status === "suspended", installing: row.is_installing === true,
    stats: null as PelicanStats | null,
  }));
  // A slow/offline node must not hide the rest of the fleet or claim zero usage.
  for (let i = 0; i < items.length; i += 4) await Promise.allSettled(items.slice(i, i + 4).map(async item => {
    if (item.suspended || item.installing) return;
    const stats = await pelicanRequest({ ...connection, account: item.uuid }, "/resources", undefined, { timeoutMs: 6000 });
    item.stats = parsePelicanStats(stats);
  }));
  const pagination = object(object(object(value).meta).pagination);
  const integer = (value: unknown, fallback: number) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000 ? value : fallback;
  return { servers: items, page, pages: Math.max(1, integer(pagination.total_pages, 1)), total: integer(pagination.total, items.length), updatedAt: new Date().toISOString() };
}
