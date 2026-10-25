"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/admin/upload";
import { btnCls } from "./ui";

/** Uploads one image and stores its storage path in a hidden form field. */
export function ImageUpload({
  name,
  folder,
  initialPath,
  initialUrl,
  label = "Image",
}: {
  name: string;
  folder: string;
  initialPath: string | null;
  initialUrl: string | null;
  label?: string;
}) {
  const [path, setPath] = useState(initialPath ?? "");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const r = await uploadImage(file, folder);
      setPath(r.path);
      setUrl(r.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-charcoal">{label}</span>
      <input type="hidden" name={name} value={path} />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mb-3 max-h-48 border border-stone object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={btnCls.ghost}>
          {busy ? "Uploading…" : url ? "Replace image" : "Upload image"}
        </button>
        {url && !busy && (
          <button type="button" onClick={() => { setPath(""); setUrl(""); }} className="text-sm text-red-700 underline">
            Remove
          </button>
        )}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="sr-only" tabIndex={-1} aria-label={`${label} file`} />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
