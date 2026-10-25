"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { uploadImage } from "@/lib/admin/upload";
import { cn } from "@/lib/utils";

function Btn({ onClick, active, label, children, disabled }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn("grid h-9 w-9 place-items-center rounded-sm border transition disabled:opacity-40", active ? "border-forest bg-forest text-ivory" : "border-stone bg-white text-charcoal hover:border-forest")}
    >
      {children}
    </button>
  );
}

/** Rich text editor. The HTML lands in a hidden input so it posts with the rest of the form; the server sanitises it again. */
export function RichTextEditor({ name, initialHtml }: { name: string; initialHtml: string }) {
  const [html, setHtml] = useState(initialHtml);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false, // required with Next.js server rendering
    shouldRerenderOnTransaction: true, // keeps toolbar active-states in sync
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }), Image],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none min-h-[340px] px-4 py-3 outline-none focus:outline-none",
        "aria-label": "Article body",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  if (!editor) return <div className="min-h-[340px] border border-stone bg-white" aria-busy="true" />;

  function setLink() {
    const prev = editor!.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link address (https://…, mailto: or tel:). Leave empty to remove the link.", prev ?? "https://");
    if (href === null) return;
    if (href.trim() === "") return void editor!.chain().focus().extendMarkRange("link").unsetLink().run();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(href.trim())) return setError("Links must start with https://, mailto: or tel:");
    setError(null);
    editor!.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await uploadImage(f, "posts");
      const alt = window.prompt("Describe the image for people using screen readers:", "") ?? "";
      editor!.chain().focus().setImage({ src: url, alt }).run();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  const ic = "h-4 w-4";

  return (
    <div>
      <input type="hidden" name={name} value={html} />
      <div className="flex flex-wrap gap-1.5 border border-b-0 border-stone bg-ivory p-2" role="toolbar" aria-label="Formatting">
        <Btn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className={ic} /></Btn>
        <Btn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className={ic} /></Btn>
        <Btn label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className={ic} /></Btn>
        <Btn label="Subheading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className={ic} /></Btn>
        <Btn label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className={ic} /></Btn>
        <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className={ic} /></Btn>
        <Btn label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className={ic} /></Btn>
        <Btn label="Link" active={editor.isActive("link")} onClick={setLink}><Link2 className={ic} /></Btn>
        <Btn label={busy ? "Uploading image…" : "Insert image"} disabled={busy} onClick={() => file.current?.click()}><ImagePlus className={ic} /></Btn>
        <span className="mx-1 w-px bg-stone" aria-hidden="true" />
        <Btn label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className={ic} /></Btn>
        <Btn label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className={ic} /></Btn>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" onChange={onImage} className="sr-only" tabIndex={-1} aria-label="Image file" />
      </div>
      <div className="border border-stone bg-white">
        <EditorContent editor={editor} />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
