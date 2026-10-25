import "server-only";
import sanitize from "sanitize-html";
import { publicEnv } from "@/lib/env";

const storagePrefix = `https://${new URL(publicEnv.NEXT_PUBLIC_SUPABASE_URL).host}/storage/v1/object/public/blog-images/`;

/** Allow-list sanitiser for editor output. Runs on every save, so stored HTML is always safe to render. */
export function sanitizePostHtml(html: string) {
  return sanitize(html, {
    allowedTags: ["p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "a", "img", "hr", "code", "pre"],
    allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer nofollow",
          ...(attribs.href?.startsWith("http") ? { target: "_blank" } : {}),
        },
      }),
    },
    // Only images uploaded to our own bucket are allowed
    exclusiveFilter: (frame) => frame.tag === "img" && !(frame.attribs.src ?? "").startsWith(storagePrefix),
  });
}

export function plainText(html: string) {
  return sanitize(html, { allowedTags: [], allowedAttributes: {} });
}

export function readingMinutes(html: string) {
  const words = plainText(html).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
