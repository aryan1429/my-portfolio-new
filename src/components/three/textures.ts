import { LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, Texture } from "three";

/**
 * Lazy, downscaled thumbnail textures for the /edits film frames.
 *
 * Some source thumbnails are multi-megabyte PNGs, so instead of drei's `useTexture` (which decodes
 * the full image on the main thread) we request a 640 px rendition from the Next image optimizer
 * (falling back to the original file), decode it off-thread with `createImageBitmap` at the target
 * width, and cache one promise per URL so React's `use()` can suspend on it.
 */

export interface Thumbnail {
  texture: Texture;
  /** width / height of the decoded image. */
  aspect: number;
}

const TARGET_WIDTH = 640;
const promises = new Map<string, Promise<Thumbnail>>();
const resolved = new Map<string, Thumbnail>();
let generation = 0;

function optimizedUrl(src: string, width: number): string | null {
  if (!src.startsWith("/") || src.startsWith("//") || src.endsWith(".svg")) return null;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Thumbnail request failed (${res.status}): ${url}`);
  return res.blob();
}

async function decode(blob: Blob, width: number): Promise<{ source: ImageBitmap | HTMLCanvasElement; w: number; h: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { resizeWidth: width, resizeQuality: "high" });
      return { source: bitmap, w: bitmap.width, h: bitmap.height };
    } catch {
      // Older engines reject the resize options — fall through to the <img> path.
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const scale = Math.min(1, width / Math.max(1, img.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable for thumbnail decode");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { source: canvas, w: canvas.width, h: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function load(src: string): Promise<Thumbnail> {
  const gen = generation;
  const optimized = optimizedUrl(src, TARGET_WIDTH);
  let blob: Blob;
  try {
    blob = await fetchBlob(optimized ?? src);
  } catch (err) {
    if (!optimized) throw err;
    blob = await fetchBlob(src);
  }
  const { source, w, h } = await decode(blob, TARGET_WIDTH);
  const texture = new Texture(source);
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false; // ImageBitmaps ignore UNPACK_FLIP_Y; the frame shader flips v instead.
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  const thumb: Thumbnail = { texture, aspect: w / Math.max(1, h) };
  // Only track it for disposal if the cache was not flushed while this request was in flight.
  if (gen === generation) resolved.set(src, thumb);
  return thumb;
}

/** Returns a stable (cached) promise for `src` — safe to pass to React's `use()`. */
export function loadThumbnail(src: string): Promise<Thumbnail> {
  let p = promises.get(src);
  if (!p) {
    p = load(src);
    promises.set(src, p);
  }
  return p;
}

/**
 * Free GPU memory for every decoded thumbnail and forget the cache. Image sources are left to the
 * GC (not `close()`d) so a texture still referenced after a StrictMode effect replay can re-upload.
 */
export function disposeThumbnails(): void {
  for (const thumb of resolved.values()) thumb.texture.dispose();
  resolved.clear();
  promises.clear();
  generation += 1;
}
