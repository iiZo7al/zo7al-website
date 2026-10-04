import "server-only";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { publicPanelOrigin, validServerId, type ConnectionInput } from "../data/dashboard";
import { parsePelicanServer, parsePelicanStats, publicIPv4, type PelicanServer } from "../data/pelican";
import { allowedPelicanEndpoint, object, type PelicanOperation } from "../data/pelican-management";

async function publicAddress(hostname: string): Promise<string> {
  if (isIP(hostname)) throw Error("INVALID_HOST");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(hostname,{ family:4, all:true }),
    new Promise<never>((_resolve,reject) => { timer=setTimeout(()=>reject(Error("UPSTREAM_TIMEOUT")),5000); }),
  ]).finally(()=>clearTimeout(timer));
  if (!addresses.length || addresses.some(({address}) => !publicIPv4(address))) throw Error("INVALID_HOST");
  return addresses[0].address;
}

// The hostname is validated, resolved, and pinned to a public address. Redirects
// are never followed, so a saved panel URL cannot reach internal infrastructure.
export class PelicanError extends Error {
  constructor(public status: number) { super("PELICAN_UNAVAILABLE"); }
}
export async function pelicanRequest(connection: ConnectionInput, suffix = "", body?: Record<string,unknown> | string, options: Partial<PelicanOperation> = {}): Promise<unknown> {
  const origin = publicPanelOrigin(connection.panelUrl);
  const method=options.method ?? (body === undefined ? "GET" : "POST");
  if (connection.provider !== "pelican" || !origin || !validServerId(connection.account) || !allowedPelicanEndpoint(suffix,method,options.client)) throw Error("INVALID");
  const url = new URL(origin + (options.client ? "/api/client" : "/api/client/servers/" + encodeURIComponent(connection.account)) + suffix);
  for (const [key,value] of Object.entries(options.query ?? {})) url.searchParams.set(key,value);
  const address = await publicAddress(url.hostname);
  const payload = typeof body === "string" ? body : body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve,reject) => {
    const req = httpsRequest(url, { method, family:4,
      lookup: (_hostname,_options,callback) => callback(null,address,4),
      headers: { Accept:"application/json", Authorization:"Bearer " + connection.apiKey,
        "User-Agent":"Zo7alProjects/1.0 (zo7al.is-a.dev)", ...(payload !== undefined ? { "Content-Type":typeof body === "string" ? "text/plain; charset=utf-8" : "application/json", "Content-Length":Buffer.byteLength(payload) } : {}) },
    }, response => {
      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) { response.resume(); reject(new PelicanError(response.statusCode ?? 502)); return; }
      const chunks: Buffer[] = []; let length = 0;
      response.on("data", chunk => { length += chunk.length; if (length > 2000000) { req.destroy(Error("UPSTREAM_LIMIT")); return; } chunks.push(chunk); });
      response.on("error",reject);
      response.on("end",() => {
        try {
          const content=Buffer.concat(chunks).toString("utf8");
          resolve(options.response === "text" ? content : response.statusCode === 204 || !content ? null : JSON.parse(content));
        }
        catch { reject(Error("INVALID_UPSTREAM")); }
      });
    });
    const timer = setTimeout(() => req.destroy(Error("UPSTREAM_TIMEOUT")),30000);
    req.on("close",() => clearTimeout(timer));
    req.on("error",reject);
    req.end(payload);
  });
}
export async function pelicanOperation(connection: ConnectionInput, operation: PelicanOperation): Promise<unknown> {
  if (operation.endpoint === "/files/pull") {
    const source=new URL(String(object(operation.body).url));
    await publicAddress(source.hostname);
  }
  const result=await pelicanRequest(connection,operation.endpoint,operation.body,operation);
  if(operation.method==="GET"&&!operation.signed&&operation.response!=="text") {
    const list=["/files/list","/backups","/schedules","/databases","/users","/network/allocations","/startup","/activity","/account/api-keys","/account/ssh-keys","/account/activity"];
    if((list.includes(operation.endpoint)||(operation.client&&operation.endpoint===""))&&!Array.isArray(object(result).data))throw Error("INVALID_UPSTREAM");
  }
  if (operation.signed) {
    const raw=object(object(result).attributes).url;
    if (typeof raw !== "string" || raw.length > 32768) throw Error("INVALID_UPSTREAM");
    const url=new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || (operation.signed === "upload" && url.pathname !== "/upload/file")) throw Error("INVALID_UPSTREAM");
    await publicAddress(url.hostname);
    return {url:url.href};
  }
  return result;
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
