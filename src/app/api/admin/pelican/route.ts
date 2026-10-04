import { hasAdminSession, privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { readConnections } from "@/lib/server/dashboard-connections";
import { pelicanRequest, pelicanServer, pelicanWebsocket } from "@/lib/server/pelican";
import { validConsoleCommand } from "@/lib/data/pelican";
import { validServerId } from "@/lib/data/dashboard";
import { limitAttempt } from "@/lib/server/site-content";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return Response.json({error:"UNAUTHORIZED"},{status:401,headers:privateHeaders});
  try {
    const server=new URL(request.url).searchParams.get("server");
    if (server !== null && !validServerId(server)) return Response.json({error:"INVALID"},{status:400,headers:privateHeaders});
    const configured = (await readConnections()).pelican;
    const connection = configured && server ? {...configured,account:server} : configured;
    if (!connection) return Response.json({status:"setup"},{headers:privateHeaders});
    return Response.json({status:"connected",server:await pelicanServer(connection)},{headers:privateHeaders});
  } catch(error) { return Response.json({error:error instanceof SyntaxError || (error instanceof Error && error.message==="INVALID") ? "INVALID":"PELICAN_UNAVAILABLE"},{status:error instanceof SyntaxError || (error instanceof Error && error.message==="INVALID")?400:502,headers:privateHeaders}); }
}
export async function POST(request: Request) {
  if (!hasAdminSession(request)) return Response.json({error:"UNAUTHORIZED"},{status:401,headers:privateHeaders});
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  try {
    const input = await readJSON(request,4096) as {action?:string;command?:unknown;signal?:string;server?:unknown;confirm?:boolean};
    if (!input || !["websocket","command","power"].includes(input.action ?? "") || (input.server !== undefined && !validServerId(input.server)) || (input.action === "command" && !validConsoleCommand(input.command)) || (input.action === "power" && (! ["start","stop","restart","kill"].includes(input.signal ?? "") || (input.signal === "kill" && input.confirm !== true)))) return Response.json({error:"INVALID"},{status:400,headers:privateHeaders});
    const limit = input.action === "power" ? 6 : input.action === "websocket" ? 30 : 60;
    if (!await limitAttempt("pelican-" + input.action,limit,60)) return Response.json({error:"RATE_LIMIT"},{status:429,headers:{...privateHeaders,"Retry-After":"60"}});
    const configured = (await readConnections()).pelican;
    const connection = configured && input.server ? {...configured,account:String(input.server)} : configured;
    if (!connection) return Response.json({error:"SETUP_REQUIRED"},{status:409,headers:privateHeaders});
    if (input.action === "websocket") return Response.json(await pelicanWebsocket(connection),{headers:privateHeaders});
    await pelicanRequest(connection,input.action === "command" ? "/command" : "/power",input.action === "command" ? {command:(input.command as string).trim()} : {signal:input.signal!});
    return Response.json({ok:true},{headers:privateHeaders});
  } catch(error) { const invalid=error instanceof SyntaxError||(error instanceof Error&&error.message==="INVALID");return Response.json({error:invalid?"INVALID":"PELICAN_UNAVAILABLE"},{status:invalid?400:502,headers:privateHeaders}); }
}
