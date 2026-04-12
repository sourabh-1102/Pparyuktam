import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    // Resolve real Supabase UUID from email
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find((u) => u.email === token.email);
    if (!authUser) {
      return NextResponse.json({ error: "User not found in Supabase. Please complete onboarding first." }, { status: 404 });
    }

    const userId = authUser.id;

    // Insert team (service role bypasses RLS)
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .insert({ name: name.trim(), description: description?.trim() || null, created_by: userId })
      .select()
      .single();

    if (teamError) throw new Error(teamError.message);

    // Add creator as team member
    const { error: memberError } = await supabaseAdmin
      .from("team_members")
      .insert({ team_id: team.id, user_id: userId });

    if (memberError) {
      console.error("Member insert error (non-fatal):", memberError.message);
    }

    return NextResponse.json({ success: true, team });
  } catch (err: any) {
    console.error("Create team error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
