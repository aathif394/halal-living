import type { ImgHTMLAttributes } from "react";
import { placeImageVariants } from "@/lib/place-images";

/** Local place photos bypass on-demand transforms, including on a cold cache. */
export function PlaceImage({ src, alt, loading = "lazy", ...props }: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
  return <img {...props} {...placeImageVariants(src)} alt={alt} loading={loading} decoding="async" />;
}
