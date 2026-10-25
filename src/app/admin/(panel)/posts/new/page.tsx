import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, btnCls } from "@/components/admin/ui";
import { PostForm } from "@/components/admin/post-form";

export const metadata: Metadata = { title: "New article" };

export default async function NewPostPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: cats } = await supabase.from("categories").select("id, name").order("name");

  return (
    <>
      <PageTitle title="New article" actions={<Link href="/admin/posts" className={btnCls.ghost}>← All articles</Link>} />
      <PostForm
        categories={cats ?? []}
        post={{ id: "", title: "", slug: "", excerpt: "", category_id: "", status: "draft", publish_at: "", cover_image: "", cover_url: "", cover_alt: "", content_html: "", seo_title: "", seo_description: "" }}
      />
    </>
  );
}
