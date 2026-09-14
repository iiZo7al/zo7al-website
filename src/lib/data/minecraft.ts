export const MINECRAFT_SERVER = {
  javaAddress: "zo7al.play-mc.fun",
  // No verified Bedrock address is published yet — the UI must say so
  // rather than invent one.
  bedrockAddress: null as string | null,
  storeUrl: "https://zo7al.tebex.io/",
  discordUrl: "https://discord.gg/nxScVYrSXq",
};

export const MINECRAFT_VERSIONS = [
  {
    id: "1.8.9",
    label: "1.8.9",
    tag: "PvP legacy",
    description: "The classic combat build most PvP players still connect on.",
  },
  {
    id: "1.20.x",
    label: "1.20.x",
    tag: "Survival",
    description: "Stable modern survival with full feature support.",
  },
  {
    id: "1.21.x",
    label: "1.21.x",
    tag: "Latest",
    description: "Current release line, kept up to date as updates ship.",
  },
] as const;

export const MINECRAFT_MODES = [
  {
    id: "survival",
    title: "Survival",
    status: "live" as const,
    description:
      "Long-term survival on the main world — economy, land claims and a persistent community.",
  },
  {
    id: "pvp",
    title: "PvP",
    status: "live" as const,
    description: "Combat-focused world built for fast fights and practice.",
  },
  {
    id: "coming-soon",
    title: "New game mode",
    status: "soon" as const,
    description: "Something new is in development for the network.",
  },
] as const;
