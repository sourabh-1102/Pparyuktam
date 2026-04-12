import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized: No NextAuth session found" }, { status: 401 });
    }

    const { project_id, team_id } = await req.json();

    if (!project_id || !team_id) {
      return NextResponse.json({ error: "project_id and team_id are required" }, { status: 400 });
    }

    // Upsert into applications table (team-based enrollment)
    const { data, error } = await supabaseAdmin
      .from("applications")
      .upsert(
        { team_id, project_id, status: "pending" },
        { onConflict: "project_id,team_id" }
      )
      .select();

    if (error) {
      console.error("Supabase Admin Upsert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("API Error enrolling in project:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
