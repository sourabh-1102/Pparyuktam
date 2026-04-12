import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * GET /api/submissions/my?project_id=UUID
 * Returns the student's own team submission for a given project.
 * Unlike /api/submissions/list (which is company-only), this is for students.
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

    // Resolve user
    let userId: string | null = null;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", token.email)
      .maybeSingle();

    if (profile) {
      userId = profile.id;
    } else {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = users?.find((u) => u.email === token.email);
      if (authUser) userId = authUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the user's teams
    const { data: memberships } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId);

    const teamIds = (memberships || []).map((m) => m.team_id);

    if (teamIds.length === 0) {
      return NextResponse.json({ data: null });
    }

    // Find submission for this project from any of the user's teams
    const { data: submission } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("project_id", projectId)
      .in("team_id", teamIds)
      .maybeSingle();

    if (!submission) {
      return NextResponse.json({ data: null });
    }

    // Generate signed URL if file exists
    let downloadUrl: string | null = null;
    if (submission.file_path) {
      const { data: signedData } = await supabaseAdmin.storage
        .from("project-submissions")
        .createSignedUrl(submission.file_path, 60 * 60);
      downloadUrl = signedData?.signedUrl || null;
    }

    return NextResponse.json({
      data: {
        id: submission.id,
        submission_type: submission.submission_type,
        github_repo_url: submission.github_repo_url,
        download_url: downloadUrl,
        submitted_at: submission.submitted_at,
      },
    });
  } catch (error: any) {
    console.error("Submissions/my error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
