export type ActionState = { ok?: boolean; error?: string; message?: string };
export const fail = (error: string): ActionState => ({ error });
export const done = (message = "Saved."): ActionState => ({ ok: true, message });
