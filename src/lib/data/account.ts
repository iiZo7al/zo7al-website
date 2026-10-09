export type MinecraftLink = { uuid: string; username: string; linkedAt: string };
export type SiteAccount = { id: string; name: string; email: string; avatar: string | null; providers: { id: string; provider: string }[]; minecraft: MinecraftLink | null };
export const ACCOUNT_PROVIDERS = ['discord', 'google', 'azure'] as const;
export function accountProviderName(provider: string) { return provider === 'azure' ? 'Microsoft' : provider === 'google' ? 'Google' : provider === 'discord' ? 'Discord' : provider; }
export function minecraftName(value: unknown): string | null {
  return typeof value === 'string' && /^[.a-zA-Z0-9_ ]{3,32}$/.test(value.trim()) ? value.trim() : null;
}
export function accountEmail(value: unknown): string | null {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? value.trim().toLowerCase() : null;
}
export function accountPassword(value: unknown): value is string { return typeof value === 'string' && value.length >= 12 && value.length <= 128; }
export function safeAccountName(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 64 && !/[<>\x00-\x1f\x7f]/.test(value) ? value.trim() : null;
}
export function accountNext(value: unknown): string { return typeof value === 'string' && /^\/(?:store|requests|account|minecraft|fortnite)(?:[?#][^\\]*)?$/.test(value) ? value : '/account'; }
export const LINK_CODE = /^[A-HJ-NP-Z2-9]{8}$/;
export function checkoutRecipient(gift: unknown, supplied: unknown, linked: MinecraftLink | null) {
  if (gift !== undefined && typeof gift !== 'boolean') throw Error('INVALID');
  if (gift === true) { const name = minecraftName(supplied); if (!name) throw Error('INVALID'); return name; }
  if (!linked) throw Error('LINK_REQUIRED');
  return linked.username;
}
