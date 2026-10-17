const EASTER_EGG_KEY = "zo7al-easter-eggs-found";
const EASTER_EGG_EVENT = "zo7al:easter-eggs-change";

export function hasFoundFirstEasterEgg() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EASTER_EGG_KEY) === "first";
  } catch {
    return false;
  }
}

export function discoverFirstEasterEgg() {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(EASTER_EGG_KEY) === "first") return false;
    window.localStorage.setItem(EASTER_EGG_KEY, "first");
    window.dispatchEvent(new Event(EASTER_EGG_EVENT));
    return true;
  } catch {
    return false;
  }
}

export const EASTER_EGG_CHANGE_EVENT = EASTER_EGG_EVENT;
