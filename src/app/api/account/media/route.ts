import { randomUUID } from "node:crypto";
import {
  AccountError,
  accountHeaders,
  accountOrigin,
  requireAccount,
  accountView,
} from "@/lib/server/account-auth";
import { siteDatabase } from "@/lib/server/site-db";
import { normalizeContentImage } from "@/lib/server/content-media";
import { limitAttempt } from "@/lib/server/site-content";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = accountHeaders();
  try {
    if (!accountOrigin(request)) throw new AccountError("INVALID", 403);
    const user = await requireAccount(request, headers);
    await accountView(user);
    if (!(await limitAttempt("profile-media:" + user.id, 10, 900)))
      throw new AccountError("RATE_LIMIT", 429);
    const reader = request.body?.getReader();
    if (!reader) throw new AccountError("INVALID");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.length;
        if (size > 5 * 1024 * 1024) throw new AccountError("INVALID", 413);
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel();
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
    const file = form.get("image");
    if (!(file instanceof File) || !file.size)
      throw new AccountError("INVALID");
    const image = await normalizeContentImage(
        Buffer.from(await file.arrayBuffer()),
      ),
      id = randomUUID();
    await (
      await siteDatabase()
    ).query(
      "INSERT INTO site_profile_images(id,user_id,bytes) VALUES($1,$2,$3)",
      [id, user.id, image.data],
    );
    return Response.json({ url: "/api/profile-media/" + id }, { headers });
  } catch (error) {
    return Response.json(
      { error: error instanceof AccountError ? error.code : "UNAVAILABLE" },
      { status: error instanceof AccountError ? error.status : 503, headers },
    );
  }
}
