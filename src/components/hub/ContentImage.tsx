import Image from "next/image";
import { contentImageUrl, type ContentImage as StoredImage } from "@/lib/data/content-media";
export default function ContentImage({ image, title, className = "" }: { image?: StoredImage | null; title: string; className?: string }) {
  return image ? <figure className={"hub-content-image " + className}><Image src={contentImageUrl(image)} alt={title} width={image.width} height={image.height} unoptimized /></figure> : null;
}
