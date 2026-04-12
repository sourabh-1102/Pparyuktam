import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qbvdtcejdjrdhuqdlawu.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function test() {
  try {
    const { data: profiles, error: profileError } = await supabaseAdmin.from("profiles").select("role, company_name, industry, website").limit(1);
    if (profileError) {
      console.error("Profile Error:", profileError);
    } else {
      console.log("Profiles count:", profiles?.length);
    }
  } catch (err) {
    console.error("Catch Exception:", err);
  }
}

test();
