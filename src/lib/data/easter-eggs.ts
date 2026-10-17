const EASTER_EGG_KEY = "zo7al-easter-eggs-found";
const EASTER_EGG_EVENT = "zo7al:easter-eggs-change";
export const MIKU_FLYBY_EVENT = "zo7al:miku-flyby";

function foundEggs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(EASTER_EGG_KEY);
    if (!stored) return [];
    if (stored === "first") return ["saturn"];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => value === "saturn" || value === "miku")
      : [];
  } catch {
    return [];
  }
}

function discover(id: "saturn" | "miku") {
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

function playDistantWhistle() {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const pan = context.createStereoPanner();
    const start = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1480, start);
    oscillator.frequency.exponentialRampToValueAtTime(920, start + 2.8);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.009, start + 1.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.8);
    pan.pan.setValueAtTime(-0.9, start);
    pan.pan.linearRampToValueAtTime(0.9, start + 2.8);
    oscillator.connect(gain);
    gain.connect(pan);
    pan.connect(context.destination);
    oscillator.onended = () => { void context.close(); };
    oscillator.start(start);
    oscillator.stop(start + 2.82);
    void context.resume();
  } catch {
    // Keep the visual Easter egg available when audio is blocked or unavailable.
  }
}

export function hasFoundSaturnEasterEgg() {
  return foundEggs().includes("saturn");
}

export function hasFoundMikuEasterEgg() {
  return foundEggs().includes("miku");
}

export function hasFoundFirstEasterEgg() {
  return foundEggs().length > 0;
}

export function discoverFirstEasterEgg() {
  return discover("saturn");
}

export function discoverMikuEasterEgg() {
  const isNew = discover("miku");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MIKU_FLYBY_EVENT));
    playDistantWhistle();
  }
  return isNew;
}

export const EASTER_EGG_CHANGE_EVENT = EASTER_EGG_EVENT;
