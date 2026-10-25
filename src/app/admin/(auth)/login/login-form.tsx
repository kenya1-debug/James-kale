"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
        <input
          id="email" name="email" type="email" autoComplete="username" required
          className="w-full rounded-sm border border-stone bg-white px-4 py-3 outline-none focus:border-forest"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
        <input
          id="password" name="password" type="password" autoComplete="current-password" required minLength={8}
          className="w-full rounded-sm border border-stone bg-white px-4 py-3 outline-none focus:border-forest"
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>
      )}
      <button
        type="submit" disabled={pending}
        className="w-full rounded-sm bg-forest px-6 py-3 font-medium text-ivory transition hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
