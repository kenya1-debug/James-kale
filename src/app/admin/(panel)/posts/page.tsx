import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNairobi } from "@/lib/admin/time";
import { ActionForm, DeleteForm, SubmitButton } from "@/components/admin/action-form";
import { Card, PageTitle, StatusBadge, btnCls, inputCls } from "@/components/admin/ui";
import { addCategory, deleteCategory } from "../_actions/posts";

export const metadata: Metadata = { title: "Blog posts" };

export default async function PostsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [posts, cats] = await Promise.all([
    supabase.from("posts").select("id, slug, title, status, published_at, updated_at, category:categories(name)").order("updated_at", { ascending: false }),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  return (
    <>
      <PageTitle title="Blog posts" subtitle="Write, schedule and publish articles." actions={<Link href="/admin/posts/new" className={btnCls.primary}>New article</Link>} />

      <div className="overflow-x-auto border border-stone bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone bg-ivory text-xs uppercase tracking-wide text-charcoal/70">
            <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Publish date</th></tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {(posts.data ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-charcoal/70">No articles yet.</td></tr>}
            {(posts.data ?? []).map((p: any) => (
              <tr key={p.id} className="hover:bg-ivory/60">
                <td className="px-4 py-3 font-medium"><Link href={`/admin/posts/${p.id}`} className="text-forest hover:underline">{p.title}</Link></td>
                <td className="px-4 py-3">{p.category?.name ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-charcoal/70">{p.published_at ? formatNairobi(p.published_at) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="mt-8">
        <h2 className="font-serif text-h3 text-forest">Categories</h2>
        <ul className="mt-4 divide-y divide-stone">
          {(cats.data ?? []).map((c: any) => (
            <li key={c.id} className="flex items-center justify-between gap-4 py-2">
              <span>{c.name}</span>
              <DeleteForm action={deleteCategory} id={c.id} confirmText="Delete this category? Articles in it are kept but become uncategorised." />
            </li>
          ))}
        </ul>
        <ActionForm action={addCategory} className="mt-5 flex flex-wrap items-start gap-3">
          <input name="name" placeholder="New category name" aria-label="New category name" maxLength={40} className={`${inputCls} max-w-xs`} />
          <SubmitButton pendingText="Adding…">Add category</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
