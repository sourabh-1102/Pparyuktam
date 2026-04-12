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

    const { application_id, project_id, status } = await req.json();

    if (!application_id || !project_id) {
      return NextResponse.json({ error: "application_id and project_id are required" }, { status: 400 });
    }

    const newStatus = status || "shortlisted";

    // Update application status in applications table
    const { data, error } = await supabaseAdmin
      .from("applications")
      .update({ status: newStatus })
      .eq("id", application_id)
      .select();

    if (error) {
      console.error("Supabase Admin Update Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If accepting (selected), update project status to in_progress
    if (newStatus === "selected") {
      const { error: projError } = await supabaseAdmin
        .from("projects")
        .update({ status: "in_progress" })
        .eq("id", project_id);

      if (projError) {
        console.error("Supabase Project Status Update Error:", projError);
      }
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("API Error updating application:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
