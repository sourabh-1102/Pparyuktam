import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase Service Role client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function findAuthUserByEmail(email: string): Promise<any | null> {
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = users.find((u: any) => u.email === email);
    if (found) return found;
    if (users.length < perPage) return null;
    page++;
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token?.sub || !token?.email) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const { selectedRole, companyName, industry, website } = await req.json();

    if (!selectedRole) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    if (selectedRole === "Company" && !companyName) {
      return NextResponse.json({ error: "Company Name is required" }, { status: 400 });
    }

    // Exact DB enum value — type is 'user_role' with values 'Individual' | 'Company'
    const roleEnum = selectedRole === "Company" ? "Company" : "Individual";

    // Resolve target Supabase UUID
    let targetUserId = token.sub;

    // If token.sub is a numeric Google ID (no dashes), resolve to Supabase UUID
    if (!targetUserId.includes("-")) {
      console.log(`Resolving numeric Google ID for ${token.email}...`);

      let authUser = await findAuthUserByEmail(token.email!);

      if (!authUser) {
        console.log(`User not in auth.users — provisioning...`);
        // NOTE: The on_auth_user_created trigger has been dropped.
        // We provision the auth user here and then manually upsert the profile below.
        const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: token.email!,
          email_confirm: true,
          user_metadata: { full_name: token.name || "User" },
        });
        if (createError) {
          console.error("Create user error:", createError);
          throw new Error(`Failed to provision auth user: ${createError.message}`);
        }
        if (!newUser) throw new Error("User creation returned null");
        authUser = newUser;
      }

      targetUserId = authUser.id;
      console.log(`Resolved UUID: ${targetUserId}`);
    }

    // Upsert profiles table.
    // Schema (from DB): id (uuid, PK+FK to auth.users), full_name, avatar_url,
    //   role (user_role enum), created_at, updated_at, company_name, industry,
    //   website, user_id, email — all nullable except id, created_at, updated_at.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id:           targetUserId,   // Sync IDs explicitly
          user_id:      targetUserId,   // FK to auth.users.id
          email:        token.email,
          full_name:    token.name || "",
          role:         roleEnum,       // 'Individual' | 'Company' (user_role enum)
          company_name: selectedRole === "Company" ? companyName : null,
          industry:     selectedRole === "Company" ? industry    : null,
          website:      selectedRole === "Company" ? website     : null,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API /profile/setup error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
