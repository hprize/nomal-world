"use server";

import { createServerClient } from "@nomal-world/db/server";
import { redirect } from "next/navigation";

export async function signOut(): Promise<void> {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
