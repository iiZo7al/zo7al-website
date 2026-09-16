let memoryKey: string | undefined;
export function playerKey(): string {
  if (memoryKey) return memoryKey;
  try { const saved = localStorage.getItem("zo7al-player-key"); if (saved && /^[a-f0-9]{64}$/.test(saved)) return memoryKey = saved; } catch {}
  memoryKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, "0")).join("");
  try { localStorage.setItem("zo7al-player-key", memoryKey); } catch {}
  return memoryKey;
}
