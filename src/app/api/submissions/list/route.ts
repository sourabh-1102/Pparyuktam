import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Environment Validation Failed: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "Missing backend configuration" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Fetch submissions using explicit foreign key to avoid "more than one relationship" ambiguity error
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select(`
        *,
        teams!fk_submissions_team (
          name
        )
      `)
      .eq("project_id", projectId);

    if (error) {
      console.error("Supabase Fetch Error:", error); 
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mapping to support existing frontend UI (which looks for sub.team_name and signed urls)
    const enriched = await Promise.all((data || []).map(async (sub) => {
        let downloadUrl: string | null = null;
        if (sub.file_path) {
          const { data: signedData } = await supabaseAdmin.storage
            .from("project-submissions")
            .createSignedUrl(sub.file_path, 60 * 60); 
          downloadUrl = signedData?.signedUrl || null;
        }

        return {
          ...sub,
          team_name: sub.teams?.name || "Unknown Team",
          download_url: downloadUrl,
        };
    }));

    // Returning { data: ... } structure to prevent breaking React setSubmissions(json.data)
    return NextResponse.json({ data: enriched });
  } catch (err: any) {
    console.error("List API Crash:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

