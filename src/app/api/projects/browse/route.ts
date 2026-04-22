import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/projects/browse
 * Returns all open/in_progress projects with company profile info.
 * Used by both the /projects page and the student Live Projects tab.
 * Uses supabaseAdmin to bypass RLS.
 */
export async function GET(req: NextRequest) {
  try {
    // Fetch all browseable projects
    const { data: projects, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .in("status", ["open", "Open", "in_progress"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Browse projects error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Resolve company names from profiles
    const companyIds = Array.from(new Set(projects.map((p: any) => p.company_id)));
    let profileMap: Record<string, string> = {};

    if (companyIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, company_name, full_name")
        .in("id", companyIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          profileMap[p.id] = p.company_name || p.full_name || "Unknown Company";
        });
      }
    }

    // Merge company names into project data
    const enriched = projects.map((p: any) => ({
      ...p,
      company_name: profileMap[p.company_id] || "Unknown Company",
    }));

    return NextResponse.json({ data: enriched });
  } catch (err: any) {
    console.error("GET /api/projects/browse error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
