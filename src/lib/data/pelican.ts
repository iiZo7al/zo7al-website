import { metricNumber, validServerId } from "./dashboard";

export type PelicanState = "running" | "starting" | "stopping" | "offline" | "stopped";
export type PelicanStats = { state: PelicanState | null; cpu: number | null; memory: number | null; disk: number | null; uptime: number | null };
export type PelicanServer = { name: string; uuid: string; limits: { cpu: number | null; memory: number | null; disk: number | null }; stats: PelicanStats; updatedAt: string };
export const pelicanState = (v: unknown): PelicanState | null => typeof v === "string" && ["running","starting","stopping","offline","stopped"].includes(v) ? v as PelicanState : null;
const record = (v: unknown): Record<string,unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string,unknown> : {};
export function parsePelicanStats(value: unknown, websocket = false): PelicanStats {
  const root = record(value), attributes = websocket ? root : record(root.attributes);
  const resources = websocket ? root : record(attributes.resources);
  const state = pelicanState(websocket ? root.state : attributes.current_state);
  if (!websocket && !state) throw Error("INVALID_UPSTREAM");
  return { state, cpu: metricNumber(resources.cpu_absolute), memory: metricNumber(resources.memory_bytes),
    disk: metricNumber(resources.disk_bytes), uptime: metricNumber(resources.uptime) };
}
export function parsePelicanServer(value: unknown): Pick<PelicanServer,"name"|"uuid"|"limits"> {
  const attributes = record(record(value).attributes), limits = record(attributes.limits);
  if (!validServerId(attributes.uuid) || typeof attributes.name !== "string") throw Error("INVALID_UPSTREAM");
  return { name: attributes.name.slice(0,200), uuid: attributes.uuid,
    limits: { cpu: metricNumber(limits.cpu), memory: metricNumber(limits.memory), disk: metricNumber(limits.disk) } };
}
export function validConsoleCommand(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 1000 && !/[\x00-\x1f\x7f]/.test(value);
}
// Terminal escape codes are removed; React renders logs as text, never HTML.
export function cleanConsoleLine(value: string): string {
  return value.slice(0,16000).replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "").replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
}
export function publicIPv4(value: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return false;
  const [a,b,c,d] = value.split(".").map(Number);
  if ([a,b,c,d].some(n => n > 255)) return false;
  if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)) return false;
  if (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}
