const EASTER_EGG_KEY = "zo7al-easter-eggs-found";
const EASTER_EGG_EVENT = "zo7al:easter-eggs-change";

function foundEggs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(EASTER_EGG_KEY);
    if (!stored) return [];
    if (stored === "first") return ["saturn"];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function discover(id: string) {
  if (typeof window === "undefined") return false;
  try {
    const eggs = foundEggs();
    if (eggs.includes(id)) return false;
    window.localStorage.setItem(EASTER_EGG_KEY, JSON.stringify([...eggs, id]));
    window.dispatchEvent(new Event(EASTER_EGG_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function hasFoundFirstEasterEgg() {
  return foundEggs().includes("saturn") || foundEggs().length > 0;
}

export function discoverFirstEasterEgg() {
  return discover("saturn");
}

export function hasFoundCreeperEasterEgg() {
  return foundEggs().includes("creeper");
}

export function discoverCreeperEasterEgg() {
  return discover("creeper");
}

export const EASTER_EGG_CHANGE_EVENT = EASTER_EGG_EVENT;
