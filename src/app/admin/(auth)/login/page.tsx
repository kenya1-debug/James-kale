import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-6">
      <div className="w-full max-w-sm rounded-sm bg-ivory p-8 shadow-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-brass-text">Staff access</p>
        <h1 className="mb-6 mt-1 font-serif text-h3">James Kale &amp; Co. Advocates</h1>
        {error === "inactive" && (
          <p role="alert" className="mb-5 rounded-sm bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This account has not been activated yet. Please contact the administrator.
          </p>
        )}
        <LoginForm next={next} />
      </div>
    </main>
  );
}
