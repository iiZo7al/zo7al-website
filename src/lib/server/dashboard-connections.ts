import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { siteDatabase } from "./site-db";
import { connectionProviders, validConnection, type ConnectionInput, type ConnectionProvider, type DashboardConnection } from "../data/dashboard";

function encryptionKey(secret: string) {
  if (secret.length < 43) throw Error("UNAVAILABLE");
  return createHash("sha256").update("zo7al-dashboard-connections:" + secret).digest();
}
export function sealConnection(input: ConnectionInput, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  cipher.setAAD(Buffer.from(input.provider));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(input), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}
export function openConnection(sealed: string, provider: ConnectionProvider, secret: string): ConnectionInput {
  const [version, iv, tag, ciphertext, extra] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext || extra) throw Error("INVALID");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(provider));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  const input = JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8"));
  const validated = validConnection(input);
  if (!validated || validated.provider !== provider) throw Error("INVALID");
  return validated;
}
export async function readConnections(): Promise<Partial<Record<ConnectionProvider, ConnectionInput>>> {
  const result = await (await siteDatabase()).query("SELECT provider,sealed FROM dashboard_connections");
  const connections: Partial<Record<ConnectionProvider, ConnectionInput>> = {};
  for (const row of result.rows) {
    if (!connectionProviders.includes(row.provider)) continue;
    try { connections[row.provider as ConnectionProvider] = openConnection(row.sealed, row.provider, process.env.ZO7AL_ADMIN_SESSION_SECRET ?? ""); }
    catch { /* A rotated encryption secret requires reconnecting, without exposing ciphertext. */ }
  }
  for (const provider of connectionProviders) {
    const input = validConnection({ provider, apiKey: process.env[environmentKey(provider)],
      account: provider === "pelican" ? process.env.PELICAN_SERVER_ID : process.env.YOUTUBE_CHANNEL_HANDLE || "iiZo7al", panelUrl: process.env.PELICAN_PANEL_URL });
    if (input) connections[provider] = input;
  }
  return connections;
}
export async function connectionMetadata(): Promise<DashboardConnection[]> {
  const connections = await readConnections();
  return connectionProviders.map(provider => ({
    provider, configured: !!connections[provider], account: connections[provider]?.account ?? (provider === "pelican" ? "" : "iiZo7al"),
    panelUrl: connections[provider]?.panelUrl,
    managedByEnvironment: !!process.env[environmentKey(provider)],
  }));
}
export async function saveConnection(input: ConnectionInput) {
  if (process.env[environmentKey(input.provider)]) throw Error("MANAGED_CONNECTION");
  const sealed = sealConnection(input, process.env.ZO7AL_ADMIN_SESSION_SECRET ?? "");
  await (await siteDatabase()).query("INSERT INTO dashboard_connections(provider,sealed) VALUES($1,$2) ON CONFLICT(provider) DO UPDATE SET sealed=EXCLUDED.sealed,updated_at=now()", [input.provider,sealed]);
}
function environmentKey(provider: ConnectionProvider) {
  return provider === "youtube" ? "YOUTUBE_API_KEY" : provider === "curseforge" ? "CURSEFORGE_API_KEY" : "PELICAN_CLIENT_API_KEY";
}
