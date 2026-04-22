import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve Supabase UUID
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find((u) => u.email === token.email);
    if (!authUser) {
      return NextResponse.json({ teams: [] });
    }

    const userId = authUser.id;

    // Fetch all teams the user belongs to
    const { data: memberships, error } = await supabaseAdmin
      .from("team_members")
      .select("team_id, role, teams(id, name, created_by, created_at)")
      .eq("user_id", userId);

    if (error) {
      console.error("Fetch teams error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const teams = (memberships || []).map((m: any) => ({
      id: m.team_id,
      name: m.teams?.name || "Unknown Team",
      isLeader: m.teams?.created_by === userId,
      role: m.role,
    }));

    return NextResponse.json({ teams, userId });
  } catch (err: any) {
    console.error("GET /api/teams/my-teams error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
