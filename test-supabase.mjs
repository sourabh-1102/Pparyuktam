import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://qbvdtcejdjrdhuqdlawu.supabase.co",
  "sb_secret_svBLSUTQNM3qJGDcLjxyPA_6hgtFGK5"
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
