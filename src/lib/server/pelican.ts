import "server-only";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { publicPanelOrigin, type ConnectionInput } from "../data/dashboard";
import { parsePelicanServer, parsePelicanStats, publicIPv4, type PelicanServer } from "../data/pelican";

async function publicAddress(hostname: string): Promise<string> {
  if (isIP(hostname)) throw Error("INVALID_HOST");
  const addresses = await lookup(hostname,{ family:4, all:true });
  if (!addresses.length || addresses.some(({address}) => !publicIPv4(address))) throw Error("INVALID_HOST");
  return addresses[0].address;
}

// The hostname is validated, resolved, and pinned to a public address. Redirects
// are never followed, so a saved panel URL cannot reach internal infrastructure.
export async function pelicanRequest(connection: ConnectionInput, suffix = "", body?: Record<string,string>): Promise<unknown> {
  const origin = publicPanelOrigin(connection.panelUrl);
  if (connection.provider !== "pelican" || !origin || !["","/resources","/websocket","/command","/power"].includes(suffix)) throw Error("INVALID");
  const url = new URL(origin + "/api/client/servers/" + encodeURIComponent(connection.account) + suffix);
  const address = await publicAddress(url.hostname);
  const payload = body ? JSON.stringify(body) : undefined;
  return new Promise((resolve,reject) => {
    const req = httpsRequest(url, { method: payload ? "POST" : "GET", family:4,
      lookup: (_hostname,_options,callback) => callback(null,address,4),
      headers: { Accept:"application/json", Authorization:"Bearer " + connection.apiKey,
        "User-Agent":"Zo7alProjects/1.0 (zo7al.is-a.dev)", ...(payload ? { "Content-Type":"application/json", "Content-Length":Buffer.byteLength(payload) } : {}) },
    }, response => {
      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) { response.resume(); reject(Error("PELICAN_UNAVAILABLE")); return; }
      const chunks: Buffer[] = []; let length = 0;
      response.on("data", chunk => { length += chunk.length; if (length > 2000000) { req.destroy(Error("UPSTREAM_LIMIT")); return; } chunks.push(chunk); });
      response.on("error",reject);
      response.on("end",() => {
        try { resolve(response.statusCode === 204 ? null : JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
        catch { reject(Error("INVALID_UPSTREAM")); }
      });
    });
    const timer = setTimeout(() => req.destroy(Error("UPSTREAM_TIMEOUT")),7000);
    req.on("close",() => clearTimeout(timer));
    req.on("error",reject);
    req.end(payload);
  });
}
export async function pelicanServer(connection: ConnectionInput): Promise<PelicanServer> {
  const [server,stats] = await Promise.all([pelicanRequest(connection),pelicanRequest(connection,"/resources")]);
  return { ...parsePelicanServer(server), stats: parsePelicanStats(stats), updatedAt:new Date().toISOString() };
}
export async function pelicanWebsocket(connection: ConnectionInput): Promise<{socket:string;token:string}> {
  const value = await pelicanRequest(connection,"/websocket") as {data?:{socket?:unknown;token?:unknown}};
  const data = value?.data;
  if (typeof data?.socket !== "string" || typeof data.token !== "string" || data.token.length > 8192 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(data.token)) throw Error("INVALID_UPSTREAM");
  const socket = new URL(data.socket);
  if (socket.protocol !== "wss:" || socket.username || socket.password || socket.search || socket.hash || !/^\/api\/servers\/[a-f0-9-]{36}\/ws$/i.test(socket.pathname)) throw Error("INVALID_SOCKET");
  await publicAddress(socket.hostname);
  return { socket:socket.href, token:data.token };
}
