import { hasAdminSession, privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { readConnections } from "@/lib/server/dashboard-connections";
import { pelicanOperation, PelicanError } from "@/lib/server/pelican";
import { pelicanRead, pelicanWrite, object } from "@/lib/data/pelican-management";
import { validServerId } from "@/lib/data/dashboard";
import { limitAttempt } from "@/lib/server/site-content";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const json=(value: unknown,status=200)=>Response.json(value,{status,headers:privateHeaders});
function failure(error: unknown) {
  if (error instanceof SyntaxError || (error instanceof Error && error.message === "INVALID")) return json({error:"INVALID"},400);
  if (error instanceof PelicanError) {
    const code=error.status===403 ? "PELICAN_PERMISSION" : error.status===404 ? "PELICAN_NOT_FOUND" : error.status===422 || error.status===400 ? "PELICAN_VALIDATION" : error.status===429 ? "RATE_LIMIT" : "PELICAN_UNAVAILABLE";
    return json({error:code},error.status===429?429:error.status===403?403:error.status===422||error.status===400?422:502);
  }
  return json({error:"PELICAN_UNAVAILABLE"},502);
}
async function connectionFor(server: unknown) {
  if (server !== undefined && !validServerId(server)) throw Error("INVALID");
  const connection=(await readConnections()).pelican;
  return connection && server ? {...connection,account:String(server)} : connection;
}
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return json({error:"UNAUTHORIZED"},401);
  try {
    const input=Object.fromEntries(new URL(request.url).searchParams);
    const operation=pelicanRead(input.resource,input);
    if (!operation || (input.server !== undefined && !validServerId(input.server))) return json({error:"INVALID"},400);
    if (!await limitAttempt("pelican-read",180,60)) return json({error:"RATE_LIMIT"},429);
    const connection=await connectionFor(input.server);
    if (!connection) return json({status:"setup"});
    return json({status:"connected",data:await pelicanOperation(connection,operation)});
  } catch(error) { return failure(error); }
}
export async function POST(request: Request) {
  if (!hasAdminSession(request)) return json({error:"UNAUTHORIZED"},401);
  if (!sameOrigin(request)) return json({error:"INVALID"},403);
  try {
    const input=object(await readJSON(request,2100000));
    const operation=pelicanWrite(input.action,input.input);
    if (!operation || (input.server !== undefined && !validServerId(input.server))) return json({error:"INVALID"},400);
    const sensitive=["serverReinstall","accountPassword","apiKeyCreate","sshKeyCreate"].includes(String(input.action));
    if (!await limitAttempt(sensitive?"pelican-sensitive":"pelican-manage",sensitive?6:60,60)) return json({error:"RATE_LIMIT"},429);
    const connection=await connectionFor(input.server);
    if (!connection) return json({error:"SETUP_REQUIRED"},409);
    return json({ok:true,data:await pelicanOperation(connection,operation)});
  } catch(error) { return failure(error); }
}
