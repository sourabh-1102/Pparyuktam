import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase Service Role client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    const body = await req.json();
    const {
      selectedRole,
      // Individual fields
      fullName,
      phoneNumber,
      techstack,
      college,
      // Company fields
      companyName,
      industry,
      website,
    } = body;

    if (!selectedRole) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    if (selectedRole === "Company" && !companyName) {
      return NextResponse.json({ error: "Company Name is required" }, { status: 400 });
    }

    if (selectedRole === "Individual" && !fullName?.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
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
        const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: token.email!,
          email_confirm: true,
          user_metadata: { full_name: fullName || token.name || "User" },
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

    // Parse techstack: comma-separated string → lowercase array
    const techstackArray: string[] =
      typeof techstack === "string" && techstack.trim()
        ? techstack.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean)
        : [];

    // Build the profile upsert payload
    const profilePayload: Record<string, any> = {
      id:      targetUserId,
      user_id: targetUserId,
      email:   token.email,
      role:    roleEnum,
    };

    if (selectedRole === "Individual") {
      profilePayload.full_name    = fullName?.trim() || token.name || "";
      profilePayload.phone_number = phoneNumber?.trim() || null;
      profilePayload.techstack    = techstackArray.length > 0 ? techstackArray : null;
      profilePayload.college      = college?.trim() || null;
    } else {
      // Company
      profilePayload.full_name    = token.name || "";
      profilePayload.company_name = companyName || null;
      profilePayload.industry     = industry || null;
      profilePayload.website      = website || null;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

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
