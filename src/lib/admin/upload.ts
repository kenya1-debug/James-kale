import { createClient } from "@/lib/supabase/client";

const MAX_EDGE = 1600;

/** Resize + convert to WebP in the browser: keeps uploads small for slow connections and well under the 3 MB bucket limit. */
async function compress(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Please choose a JPG, PNG or WebP image.");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.82));
  if (!blob) throw new Error("Could not process that image.");
  return blob;
}

/** Uploads to the public blog-images bucket (admins only, enforced by storage RLS). Returns the storage path and public URL. */
export async function uploadImage(file: File, folder: string) {
  const blob = await compress(file);
  const supabase = createClient();
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from("blog-images").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error("Upload failed. Please try again.");
  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return { path, url: data.publicUrl };
}
