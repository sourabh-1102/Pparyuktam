import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

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

    // Explicit Admin Validation
    const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("email", token.email).single();
    
    const ADMIN_EMAILS = [
      "govindsingh100bn@gmail.com",
      "jatsourabhsinghgovindsingh@gmail.com"
    ];
    if (!profile?.is_admin && !ADMIN_EMAILS.includes((token.email || "").toLowerCase())) {
        return NextResponse.json({ error: "Forbidden: Admins Only" }, { status: 403 });
    }

    // Concurrently fetch counts for all dashboard statistics
    const [
        { count: studentsCount },
        { count: companiesCount },
        { count: totalProjectsCount },
        { count: activeProjectsCount },
        { count: completedProjectsCount },
        { count: totalTeamsCount },
        { count: totalApplicationsCount },
        { count: certificatesCount }
    ] = await Promise.all([
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "Individual"),
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "Company"),
        supabaseAdmin.from("projects").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabaseAdmin.from("teams").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("project_applications").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("certificates").select("*", { count: "exact", head: true })
    ]);

    return NextResponse.json({
        studentsCount: studentsCount || 0,
        companiesCount: companiesCount || 0,
        totalProjects: totalProjectsCount || 0,
        activeProjects: activeProjectsCount || 0,
        completedProjects: completedProjectsCount || 0,
        totalTeams: totalTeamsCount || 0,
        totalApplications: totalApplicationsCount || 0,
        certificatesCount: certificatesCount || 0
    });

  } catch (err: any) {
    console.error("GET /api/admin/overview error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
