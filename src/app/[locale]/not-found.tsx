import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-[60vh] place-items-center bg-ivory px-6 py-24 text-center">
      <div>
        <p className="font-serif text-8xl text-brass">404</p>
        <h1 className="mt-4 font-serif text-h2 text-forest">Page not found · Ukurasa haupatikani</h1>
        <p className="mx-auto mt-3 max-w-md text-charcoal/75">
          The page you are looking for does not exist or has moved.
        </p>
        <Link href="/" className={buttonClass("dark", "mt-8")}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
