import { hasAdminSession, privateHeaders, sameOrigin } from "@/lib/server/site-security";
import { limitAttempt } from "@/lib/server/site-content";
import { saveContentImage } from "@/lib/server/content-media";
import { CONTENT_IMAGE_UPLOAD_BYTES } from "@/lib/data/content-media";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!hasAdminSession(request)) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  if (!sameOrigin(request) || !request.headers.get("content-type")?.startsWith("multipart/form-data;")) return Response.json({ error: "INVALID" }, { status: 403, headers: privateHeaders });
  try {
    if (!(await limitAttempt("admin:content-image", 30, 60))) return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: privateHeaders });
    const reader = request.body?.getReader();
    if (!reader) throw Error("INVALID");
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) { const next = await reader.read(); if (next.done) break; size += next.value.length; if (size > CONTENT_IMAGE_UPLOAD_BYTES + 32_000) throw Error("IMAGE_SIZE"); chunks.push(next.value); }
    } finally { await reader.cancel(); }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData().catch(() => { throw Error("IMAGE_FORMAT"); });
    const file = form.get("image");
    if (!(file instanceof File) || form.getAll("image").length !== 1 || !file.size || file.size > CONTENT_IMAGE_UPLOAD_BYTES) throw Error("IMAGE_SIZE");
    const image = await saveContentImage(Buffer.from(await file.arrayBuffer()));
    return Response.json({ image }, { headers: privateHeaders });
  } catch (error) {
    const code = error instanceof Error && error.message === "IMAGE_SIZE" ? "IMAGE_SIZE" : error instanceof Error && ["IMAGE_FORMAT", "INVALID"].includes(error.message) ? "IMAGE_FORMAT" : "UNAVAILABLE";
    return Response.json({ error: code }, { status: code === "IMAGE_SIZE" ? 413 : code === "IMAGE_FORMAT" ? 400 : 503, headers: privateHeaders });
  }
}
