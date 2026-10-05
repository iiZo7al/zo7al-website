export type ContentImage = { id: string; width: number; height: number };
export const CONTENT_IMAGE_UPLOAD_BYTES = 3_500_000;
export const CONTENT_IMAGE_SOURCE_BYTES = 20_000_000;
export const contentImageId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const contentImageUrl = (image: ContentImage) => "/api/hub/media/" + encodeURIComponent(image.id);
