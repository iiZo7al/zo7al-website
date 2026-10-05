import "server-only";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { siteDatabase } from "./site-db";
import { CONTENT_IMAGE_UPLOAD_BYTES } from "../data/content-media";

export async function normalizeContentImage(bytes: Buffer) {
  if (!bytes.length || bytes.length > CONTENT_IMAGE_UPLOAD_BYTES) throw Error("IMAGE_SIZE");
  try {
    const input = sharp(bytes, { limitInputPixels: 36_000_000, failOn: "error", animated: false });
    const metadata = await input.metadata();
    if (!metadata.width || !metadata.height || !["jpeg", "png", "webp", "gif", "heif", "avif"].includes(metadata.format ?? "")) throw Error("IMAGE_FORMAT");
    const result = await input.rotate().resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90, effort: 4 }).timeout({ seconds: 15 }).toBuffer({ resolveWithObject: true });
    if (result.data.length > CONTENT_IMAGE_UPLOAD_BYTES) throw Error("IMAGE_SIZE");
    return { data: result.data, width: result.info.width, height: result.info.height };
  } catch (error) { throw Error(error instanceof Error && error.message === "IMAGE_SIZE" ? "IMAGE_SIZE" : "IMAGE_FORMAT"); }
}

export async function saveContentImage(bytes: Buffer) {
  const image = await normalizeContentImage(bytes), id = randomUUID(), db = await siteDatabase();
  await db.query("INSERT INTO site_content_images(id,mime_type,width,height,bytes) VALUES($1,'image/webp',$2,$3,$4)", [id, image.width, image.height, image.data]);
  // Abandoned editor uploads expire, while images attached to any draft stay intact.
  await db.query("DELETE FROM site_content_images i WHERE i.created_at < now()-interval '30 days' AND NOT EXISTS(SELECT 1 FROM site_content c WHERE c.image_id=i.id)").catch(() => {});
  return { id, width: image.width, height: image.height };
}
