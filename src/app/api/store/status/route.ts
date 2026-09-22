import { tebexRequest, tebexToken } from "@/lib/server/tebex";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const ident = new URL(request.url).searchParams.get("ident") ?? "";
  if (!/^[a-zA-Z0-9_-]{10,128}$/.test(ident)) return Response.json({ error: "INVALID" }, { status: 400, headers });
  const token = tebexToken();
  if (!token) return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers });
  try {
    const result = await tebexRequest(`accounts/${encodeURIComponent(token)}/baskets/${encodeURIComponent(ident)}`);
    // Cosmetic confirmation only. Tebex remains responsible for payment and fulfillment.
    // Never trust URL flags or browser events as evidence, or return customer details.
    return Response.json({ paid: result.data?.ident === ident && result.data?.complete === true }, { headers });
  } catch { return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers }); }
}
