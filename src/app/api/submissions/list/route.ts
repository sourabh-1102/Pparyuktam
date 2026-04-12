import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * GET /api/submissions/list?project_id=UUID
 * Returns all submissions for a project (company use).
 * Includes signed download URLs for ZIP files.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("project_id");
    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // Resolve company user
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", token.email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify company owns this project
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, company_id")
      .eq("id", projectId)
      .maybeSingle();

    if (!project || project.company_id !== profile.id) {
      return NextResponse.json({ error: "Not authorized to view submissions for this project" }, { status: 403 });
    }

    // Fetch submissions
    const { data: submissions, error } = await supabaseAdmin
      .from("submissions")
      .select("*, teams(name), profiles(full_name, email)")
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Fetch submissions error:", error);
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    // Generate signed URLs for ZIP files
    const enriched = await Promise.all(
      (submissions || []).map(async (sub) => {
        let downloadUrl: string | null = null;

        if (sub.file_path) {
          const { data: signedData } = await supabaseAdmin.storage
            .from("project-submissions")
            .createSignedUrl(sub.file_path, 60 * 60); // 1 hour expiry

          downloadUrl = signedData?.signedUrl || null;
        }

        return {
          id: sub.id,
          team_id: sub.team_id,
          team_name: sub.teams?.name || "Unknown Team",
          submitted_by: sub.profiles?.full_name || sub.profiles?.email || "Student",
          submission_type: sub.submission_type,
          github_repo_url: sub.github_repo_url,
          download_url: downloadUrl,
          submitted_at: sub.submitted_at,
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (error: any) {
    console.error("Submissions list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
