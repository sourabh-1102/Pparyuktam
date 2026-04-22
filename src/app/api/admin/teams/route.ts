import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";
import type { Team, TeamMember } from "@/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = ["govindsingh100bn@gmail.com", "jatsourabhsinghgovindsingh@gmail.com"];

async function verifyAdmin(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.email) return null;
  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("email", token.email).single();
  if (!profile?.is_admin && !ADMIN_EMAILS.includes((token.email || "").toLowerCase())) return null;
  return token;
}

export async function GET(req: NextRequest) {
  try {
    const adminToken = await verifyAdmin(req);
    if (!adminToken) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch teams with members, joining profiles for full_name/email
    const { data: teams, error } = await supabaseAdmin
      .from("teams")
      .select(`
        id,
        name,
        description,
        created_by,
        created_at,
        team_members (
          id,
          role,
          name,
          email,
          equity,
          user_id,
          skill_role,
          profiles (
            full_name,
            email
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch teams error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize: prefer profiles.full_name over team_members.name
    const normalized = (teams || []).map((team: any) => ({
      ...team,
      team_members: (team.team_members || []).map((m: any) => ({
        ...m,
        name: m.profiles?.full_name || m.name || m.email?.split("@")[0] || "Unknown",
        email: m.profiles?.email || m.email || "",
      })),
    }));

    return NextResponse.json({ teams: normalized });
  } catch (err: any) {
    console.error("GET /api/admin/teams error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminToken = await verifyAdmin(req);
    if (!adminToken) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { targetTeamId, action } = await req.json();

    if (!targetTeamId || action !== "delete") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("teams").delete().eq("id", targetTeamId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/admin/teams error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
