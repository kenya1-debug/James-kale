"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/admin/result";
import { btnCls } from "./ui";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: keyof typeof btnCls;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(btnCls[variant], className)}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{state.error}</p>;
  if (state.ok) return <p role="status" className="rounded-sm bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{state.message ?? "Saved."}</p>;
  return null;
}

/**
 * Wraps a server action with pending/success/error feedback.
 * Give edit forms a `key` that changes when the record changes (e.g. its updated_at) so they remount with fresh values.
 */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-4 empty:hidden"><FormMessage state={state} /></div>
    </form>
  );
}

/** One-click destructive action with a browser confirmation */
export function DeleteForm({
  action,
  id,
  label = "Delete",
  confirmText = "Delete this permanently? This cannot be undone.",
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  label?: string;
  confirmText?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={btnCls.danger}
        onClick={(e) => {
          if (!window.confirm(confirmText)) e.preventDefault();
        }}
      >
        {label}
      </button>
    </form>
  );
}
