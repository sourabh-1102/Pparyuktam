import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. AUTH CHECK
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve user ID — try profiles first, then fall back to auth.users
    let userId: string | null = null;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", token.email)
      .maybeSingle();

    if (profile) {
      userId = profile.id;
    }

    // Fallback: resolve via Supabase Auth (in case profiles.id !== auth.users.id)
    if (!userId) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = users?.find((u) => u.email === token.email);
      if (authUser) userId = authUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. PARSE FORM DATA
    const formData = await req.formData();
    const projectId = formData.get("project_id") as string;
    const teamId = formData.get("team_id") as string;
    const submissionType = formData.get("submission_type") as string;
    const githubRepoUrl = formData.get("github_repo_url") as string | null;
    const file = formData.get("file") as File | null;

    console.log("[submissions/create] Input:", { projectId, teamId, submissionType, userId });

    if (!projectId || !teamId || !submissionType) {
      return NextResponse.json({ error: "project_id, team_id, and submission_type are required" }, { status: 400 });
    }

    if (submissionType !== "zip_file" && submissionType !== "github_transfer") {
      return NextResponse.json({ error: "submission_type must be 'zip_file' or 'github_transfer'" }, { status: 400 });
    }

    // 3. TEAM MEMBERSHIP VALIDATION
    // Check if user is in this team — try both their profile ID and auth ID
    const { data: memberships } = await supabaseAdmin
      .from("team_members")
      .select("id, user_id")
      .eq("team_id", teamId);

    const isMember = (memberships || []).some(
      (m) => m.user_id === userId
    );

    if (!isMember) {
      console.log("[submissions/create] Team membership check failed.", {
        userId,
        teamId,
        members: memberships?.map((m) => m.user_id),
      });
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 });
    }

    // 4. APPLICATION STATUS VALIDATION
    const { data: application } = await supabaseAdmin
      .from("applications")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("team_id", teamId)
      .maybeSingle();

    if (!application) {
      return NextResponse.json({ error: "No application found for this project/team" }, { status: 404 });
    }

    const normalizedStatus = (application.status || "").toLowerCase();
    const validStatuses = ["shortlisted", "accepted", "in_progress"];
    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json({
        error: `Application must be Shortlisted or Accepted. Current: ${application.status}`,
      }, { status: 400 });
    }

    // 5. DUPLICATE SUBMISSION CHECK
    const { data: existingSubmission } = await supabaseAdmin
      .from("submissions")
      .select("id")
      .eq("project_id", projectId)
      .eq("team_id", teamId)
      .maybeSingle();

    if (existingSubmission) {
      return NextResponse.json({ error: "A submission already exists for this team on this project" }, { status: 400 });
    }

    // 6. PROCESS SUBMISSION
    let filePath: string | null = null;
    let repoUrl: string | null = null;

    if (submissionType === "zip_file") {
      if (!file) {
        return NextResponse.json({ error: "ZIP file is required for zip_file submission" }, { status: 400 });
      }

      if (!file.name.endsWith(".zip")) {
        return NextResponse.json({ error: "Only .zip files are accepted" }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File size must be under 10MB" }, { status: 400 });
      }

      const timestamp = Date.now();
      filePath = `${projectId}/${teamId}/${timestamp}.zip`;

      const buffer = Buffer.from(await file.arrayBuffer());

      // Try upload — if bucket doesn't exist, return helpful error
      const { error: uploadErr } = await supabaseAdmin.storage
        .from("project-submissions")
        .upload(filePath, buffer, {
          contentType: "application/zip",
          upsert: false,
        });

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        return NextResponse.json({
          error: `Failed to upload file: ${uploadErr.message}. Make sure the 'project-submissions' bucket exists in Supabase Storage.`,
        }, { status: 500 });
      }
    } else {
      if (!githubRepoUrl) {
        return NextResponse.json({ error: "github_repo_url is required for github_transfer submission" }, { status: 400 });
      }

      if (!githubRepoUrl.startsWith("https://github.com/")) {
        return NextResponse.json({ error: "Invalid GitHub URL. Must start with https://github.com/" }, { status: 400 });
      }

      repoUrl = githubRepoUrl;
    }

    // 7. DB INSERT
    const { data: submission, error: insertErr } = await supabaseAdmin
      .from("submissions")
      .insert({
        project_id: projectId,
        team_id: teamId,
        user_id: userId,
        submission_type: submissionType,
        file_path: filePath,
        github_repo_url: repoUrl,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      if (filePath) {
        await supabaseAdmin.storage.from("project-submissions").remove([filePath]);
      }
      console.error("Submission insert error:", insertErr);
      return NextResponse.json({ error: `Failed to save submission: ${insertErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Submission received successfully",
      submission_id: submission.id,
    });
  } catch (error: any) {
    console.error("Submission API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
