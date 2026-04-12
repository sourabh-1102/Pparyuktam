import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";
import { generateCertificatePDF } from "@/lib/generateCertificate";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    // 1. AUTH CHECK
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { project_id, team_id } = await req.json();

    if (!project_id || !team_id) {
      return NextResponse.json({ error: "project_id and team_id are required" }, { status: 400 });
    }

    // 2. RESOLVE COMPANY USER
    const { data: companyProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("email", token.email)
      .maybeSingle();

    if (!companyProfile) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    // 3. VERIFY COMPANY OWNERSHIP
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, title, company_id")
      .eq("id", project_id)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.company_id !== companyProfile.id) {
      return NextResponse.json({ error: "You do not own this project" }, { status: 403 });
    }

    // 4. VALIDATE APPLICATION STATUS (must be Shortlisted)
    const { data: application } = await supabaseAdmin
      .from("applications")
      .select("id, status")
      .eq("project_id", project_id)
      .eq("team_id", team_id)
      .maybeSingle();

    if (!application) {
      return NextResponse.json({ error: "No application found for this team/project" }, { status: 404 });
    }

    const acceptableStatuses = ["shortlisted", "Shortlisted"];
    if (!acceptableStatuses.includes(application.status)) {
      return NextResponse.json({
        error: `Application must be Shortlisted to accept. Current status: ${application.status}`,
      }, { status: 400 });
    }

    // 5. STEP 1 — Update application status to "Accepted"
    const { error: updateErr } = await supabaseAdmin
      .from("applications")
      .update({ status: "Accepted" })
      .eq("id", application.id);

    if (updateErr) {
      console.error("Application update error:", updateErr);
      return NextResponse.json({ error: "Failed to accept team" }, { status: 500 });
    }

    // 6. STEP 2 — Fetch all team members
    const { data: teamMembers, error: membersErr } = await supabaseAdmin
      .from("team_members")
      .select("user_id")
      .eq("team_id", team_id);

    if (membersErr || !teamMembers || teamMembers.length === 0) {
      // ROLLBACK: Revert application status
      await supabaseAdmin
        .from("applications")
        .update({ status: "shortlisted" })
        .eq("id", application.id);
      return NextResponse.json({ error: "No team members found. Acceptance rolled back." }, { status: 400 });
    }

    // Resolve team name
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("name")
      .eq("id", team_id)
      .maybeSingle();

    const teamName = team?.name || "Team";
    const companyName = companyProfile.full_name || "Company";
    const issueDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // 7. STEP 3 — Generate certificates for EACH member (3 per user)
    // Resolve student names
    const memberUserIds = teamMembers.map((m) => m.user_id);
    const { data: memberProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", memberUserIds);

    const profileMap: Record<string, { name: string; email: string }> = {};
    (memberProfiles || []).forEach((p) => {
      profileMap[p.id] = { name: p.full_name || p.email || "Student", email: p.email };
    });

    const certTypes = ["Participation", "LOE", "Confirmation"] as const;
    const certRows: any[] = [];
    const uploadPromises: Promise<void>[] = [];

    for (const member of teamMembers) {
      const studentName = profileMap[member.user_id]?.name || "Student";

      for (const certType of certTypes) {
        // Generate PDF
        const pdfBytes = await generateCertificatePDF({
          student_name: studentName,
          team_name: teamName,
          project_title: project.title,
          company_name: companyName,
          cert_type: certType,
          issue_date: issueDate,
        });

        // Upload to Supabase Storage (private bucket)
        const storagePath = `${project_id}/${team_id}/${member.user_id}/${certType.toLowerCase()}.pdf`;

        const uploadPromise = supabaseAdmin.storage
          .from("certificates")
          .upload(storagePath, Buffer.from(pdfBytes), {
            contentType: "application/pdf",
            upsert: true,
          })
          .then(({ error: uploadErr }) => {
            if (uploadErr) {
              console.error(`Upload error for ${storagePath}:`, uploadErr);
            }
          });

        uploadPromises.push(uploadPromise);

        // Generate signed URL (valid for 30 days)
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from("certificates")
          .createSignedUrl(storagePath, 60 * 60 * 24 * 30);

        certRows.push({
          user_id: member.user_id,
          project_id: project_id,
          type: certType,
          issue_date: new Date().toISOString(),
          download_url: signedUrlData?.signedUrl || null,
        });
      }
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // 8. BULK INSERT certificates (single query)
    const { error: certInsertErr } = await supabaseAdmin
      .from("certificates")
      .insert(certRows);

    if (certInsertErr) {
      // ROLLBACK: Revert application status
      await supabaseAdmin
        .from("applications")
        .update({ status: "shortlisted" })
        .eq("id", application.id);

      console.error("Certificate insert error:", certInsertErr);
      return NextResponse.json({
        error: "Failed to generate certificates. Acceptance rolled back.",
      }, { status: 500 });
    }

    // 9. Update project status to in_progress & reject other applications
    await supabaseAdmin
      .from("projects")
      .update({ status: "in_progress" })
      .eq("id", project_id);

    await supabaseAdmin
      .from("applications")
      .update({ status: "Rejected" })
      .eq("project_id", project_id)
      .neq("id", application.id);

    return NextResponse.json({
      success: true,
      message: `Team accepted. ${certRows.length} certificates generated.`,
      team_id,
      certificates_generated: certRows.length,
    });
  } catch (error: any) {
    console.error("Accept Team Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
