import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }

    // Fetch team members for the specified team using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("team_members")
      .select("id, user_id, role, profiles(full_name, email, avatar_url)")
      .eq("team_id", teamId);

    if (error) {
      console.error("Fetch team members error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: data || [] });
  } catch (err: any) {
    console.error("GET /api/teams/members error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
