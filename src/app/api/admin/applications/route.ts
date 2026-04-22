import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";
import type { Application } from "@/types";

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

    // Fetch applications with proper relational joins
    // Uses 'applications' table (consistent with the rest of the app)
    const { data: applications, error } = await supabaseAdmin
      .from("applications")
      .select(`
        id,
        team_id,
        project_id,
        status,
        created_at,
        projects (
          id,
          title,
          company_name
        ),
        teams (
          id,
          name,
          team_members (
            name,
            email,
            role,
            profiles (
              full_name,
              email
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch applications error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize member names from profiles
    const normalized = (applications || []).map((app: any) => ({
      ...app,
      teams: app.teams
        ? {
            ...app.teams,
            team_members: (app.teams.team_members || []).map((m: any) => ({
              ...m,
              name: m.profiles?.full_name || m.name || m.email?.split("@")[0] || "Unknown",
              email: m.profiles?.email || m.email || "",
            })),
          }
        : null,
    }));

    return NextResponse.json({ applications: normalized });
  } catch (err: any) {
    console.error("GET /api/admin/applications error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminToken = await verifyAdmin(req);
    if (!adminToken) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { targetApplicationId, action, status } = await req.json();

    if (!targetApplicationId || action !== "override_status" || !status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("applications")
      .update({ status })
      .eq("id", targetApplicationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/admin/applications error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
