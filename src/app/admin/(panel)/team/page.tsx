import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Card, PageTitle, inputCls } from "@/components/admin/ui";
import { saveStaff } from "../_actions/team";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, role, is_active, updated_at").order("created_at");

  return (
    <>
      <PageTitle title="Team" subtitle="Who can sign in to this dashboard." />
      <p className="mb-6 border-l-4 border-brass bg-white px-4 py-3 text-sm text-charcoal/80">
        To add someone: create their account in Supabase (Authentication → Users → Add user), then switch them on here.
        <strong> Staff</strong> can handle consultations and messages. <strong>Admins</strong> can also edit the website, blog and settings.
      </p>
      <div className="space-y-4">
        {(data ?? []).map((u: any) => (
          <Card key={u.id}>
            <ActionForm action={saveStaff}>
              <div key={u.updated_at} className="grid items-end gap-4 sm:grid-cols-[1fr_9rem_auto_auto]">
                <input type="hidden" name="id" value={u.id} />
                <label className="block"><span className="mb-1 block text-sm font-medium">Name or email{u.id === me.id && " (you)"}</span><input name="full_name" defaultValue={u.full_name ?? ""} maxLength={100} className={inputCls} /></label>
                <label className="block"><span className="mb-1 block text-sm font-medium">Role</span>
                  <select name="role" defaultValue={u.role} className={inputCls}><option value="staff">Staff</option><option value="admin">Admin</option></select>
                </label>
                <label className="flex items-center gap-2 pb-2"><input type="checkbox" name="is_active" defaultChecked={u.is_active} className="h-5 w-5 accent-[#17382c]" />Active</label>
                <SubmitButton>Save</SubmitButton>
              </div>
            </ActionForm>
          </Card>
        ))}
      </div>
    </>
  );
}
