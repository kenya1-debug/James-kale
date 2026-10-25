import { revalidatePath } from "next/cache";

/** Public pages are statically generated; call this after any content change so visitors see it immediately. */
export const refreshSite = () => revalidatePath("/", "layout");
