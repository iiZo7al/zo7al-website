import { POST as start } from "../../src/app/api/space-run/start/route";
import { POST as finish } from "../../src/app/api/space-run/finish/route";
import { GET as leaderboard } from "../../src/app/api/space-run/leaderboard/route";

// Public anonymous game: reading scores and issuing rate-limited run tickets
// are public; writing a score requires that run's unguessable session token.
const handler = {
  async fetch(request: Request): Promise<Response> {
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600", "Cache-Control": "no-store" };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const path = new URL(request.url).pathname.replace(/\/$/, "");
    let response: Response;
    if (request.method === "GET" && path === "/leaderboard") response = await leaderboard();
    else if (request.method === "POST" && (path === "/start" || path === "/finish")) {
      const headers = new Headers(request.headers);
      // The shared handlers are also used same-origin by Next.js. This endpoint
      // deliberately supports cross-origin anonymous gameplay, without cookies.
      headers.delete("origin");
      let body: string | undefined;
      if (path === "/finish") {
        const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
        if (reader) { while (true) { const {done,value} = await reader.read(); if(done)break; bytes += value.length; if(bytes>2048){await reader.cancel();return Response.json({error:"INVALID"},{status:400,headers:cors});} chunks.push(value); } }
        body = new TextDecoder().decode(Buffer.concat(chunks));
      }
      const forwarded = new Request(request.url, { method: "POST", headers, body });
      response = path === "/start" ? await start(forwarded) : await finish(forwarded);
    } else response = Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const headers = new Headers(response.headers); Object.entries(cors).forEach(([k,v]) => headers.set(k,v));
    return new Response(response.body, {status:response.status,headers});
  }
};

export default handler;
