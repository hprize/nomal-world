"use server";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@nomal-world/db/server";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function assertAdmin(): Promise<void> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
}

export async function createHeaderButton(data: {
  label: string;
  url: string;
  color: string;
  display_order: number;
  is_active: boolean;
}): Promise<void> {
  await assertAdmin();

  const supabase = getAdminClient();
  const { error } = await supabase.from("header_buttons").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/header-buttons");
}

export async function updateHeaderButton(
  id: string,
  data: {
    label?: string;
    url?: string;
    color?: string;
    display_order?: number;
    is_active?: boolean;
  }
): Promise<void> {
  await assertAdmin();

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("header_buttons")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/header-buttons");
}

export async function deleteHeaderButton(id: string): Promise<void> {
  await assertAdmin();

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("header_buttons")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/header-buttons");
}

export async function reorderHeaderButtons(
  orderedIds: string[]
): Promise<void> {
  await assertAdmin();

  const supabase = getAdminClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("header_buttons")
      .update({ display_order: index })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePath("/header-buttons");
}
