import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token?.email) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // 1. Resolve UUID via Admin API (Source of Truth)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find(u => u.email === token.email);

    if (!authUser) {
      return NextResponse.json({ role: null, onboardingRequired: true });
    }

    const uuid = authUser.id;

    // 2. Fetch role, is_admin flag, and full_name from profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, is_admin, full_name")
      .eq("user_id", uuid)
      .maybeSingle();

    // is_admin === true always wins, regardless of the role column
    const resolvedRole = profile?.is_admin ? "Admin" : (profile?.role || null);

    // An Individual with no full_name hasn't completed the student details form yet.
    // Flag them so the front-end can redirect back to /onboarding.
    const profileIncomplete =
      resolvedRole === "Individual" && !profile?.full_name?.trim();

    return NextResponse.json({
      uuid,
      role:              resolvedRole,
      onboardingRequired: !resolvedRole,
      profileIncomplete,
    });
  } catch (error: any) {
    console.error("Session sync API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
