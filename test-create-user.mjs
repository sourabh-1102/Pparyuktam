import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qbvdtcejdjrdhuqdlawu.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function test() {
  try {
    const fakeEmail = "test" + Date.now() + "@example.com";
    console.log("Creating user:", fakeEmail);
    const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      email_confirm: true,
      user_metadata: { full_name: "Test User" }
    });
    
    if (createError) {
      console.error("Create Error:", JSON.stringify(createError, null, 2));
    } else {
      console.log("User created:", newUser?.id);
      
      // Cleanup
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      console.log("Cleanup done");
    }
  } catch (err) {
    console.error("Catch Exception:", err);
  }
}

test();
