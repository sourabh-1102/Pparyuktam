import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
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

    // 2. Fetch role from profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", uuid)
      .maybeSingle();

    return NextResponse.json({
      uuid: uuid,
      role: profile?.role || null,
      onboardingRequired: !profile?.role
    });
  } catch (error: any) {
    console.error("Session sync API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
