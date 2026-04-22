import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

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

    // Resolve user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", token.email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch certificates with project info
    const { data: certificates, error } = await supabaseAdmin
      .from("certificates")
      .select("*, projects(title)")
      .eq("user_id", profile.id)
      .order("issue_date", { ascending: false });

    if (error) {
      console.error("Certificates fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
    }

    // Generate fresh signed URLs for each certificate
    const enriched = await Promise.all(
      (certificates || []).map(async (cert) => {
        let freshUrl = cert.download_url;

        // If we have a stored path pattern, regenerate signed URL
        // The download_url might be expired, so we try to regenerate from the path
        const storagePath = `${cert.project_id}/${cert.user_id}/${cert.type.toLowerCase()}.pdf`;
        const { data: signedData } = await supabaseAdmin.storage
          .from("certificates")
          .createSignedUrl(storagePath, 60 * 60); // 1 hour

        if (signedData?.signedUrl) {
          freshUrl = signedData.signedUrl;
        }

        return {
          id: cert.id,
          type: cert.type,
          project_title: cert.projects?.title || "Unknown Project",
          project_id: cert.project_id,
          issue_date: cert.issue_date,
          download_url: freshUrl,
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (error: any) {
    console.error("Certificates API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
