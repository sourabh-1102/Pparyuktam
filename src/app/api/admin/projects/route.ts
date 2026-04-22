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

    const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("email", token.email).single();
    const ADMIN_EMAILS = ["govindsingh100bn@gmail.com", "jatsourabhsinghgovindsingh@gmail.com"];
    if (!profile?.is_admin && !ADMIN_EMAILS.includes((token.email || "").toLowerCase())) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Retrieve projects
    const { data: projects, error } = await supabaseAdmin
        .from("projects")
        .select(`
            *,
            profiles:company_id ( id, full_name, company_name, email )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch projects error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (err: any) {
    console.error("GET /api/admin/projects error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("email", token.email).single();
    const ADMIN_EMAILS = ["govindsingh100bn@gmail.com", "jatsourabhsinghgovindsingh@gmail.com"];
    if (!profile?.is_admin && !ADMIN_EMAILS.includes((token.email || "").toLowerCase())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { targetProjectId, action, payload } = await req.json();

    if (!targetProjectId || !action) {
         return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    if (action === "delete") {
        const { error } = await supabaseAdmin.from("projects").delete().eq("id", targetProjectId);
        if (error) throw error;
    } else if (action === "update_approval") {
        const { error } = await supabaseAdmin
           .from("projects")
           .update({ is_approved: Boolean(payload?.is_approved) })
           .eq("id", targetProjectId);
        if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/admin/projects error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
