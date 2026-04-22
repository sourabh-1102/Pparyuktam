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
    if (!token?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("email", token.email).single();
    const ADMIN_EMAILS = ["govindsingh100bn@gmail.com", "jatsourabhsinghgovindsingh@gmail.com"];
    if (!profile?.is_admin && !ADMIN_EMAILS.includes((token.email || "").toLowerCase())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Retrieve Reports. If table does not exist, this might fail, but this follows the schema format.
    const { data: reports, error } = await supabaseAdmin
        .from("reports")
        .select(`
            *,
            profiles:reported_by ( full_name, email )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        // If the table doesn't exist yet, we will just return an empty array to gracefully degradation.
        if (error.code === '42P01') { // relation doesn't exist
            return NextResponse.json({ reports: [] });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: reports || [] });
  } catch (err: any) {
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

    const { targetReportId, action, status } = await req.json();

    if (!targetReportId || action !== "override_status" || !status) {
         return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
       .from("reports")
       .update({ status })
       .eq("id", targetReportId);

    if (error) {
        if (error.code === '42P01') throw new Error("Reports table is not yet initialized in the database.");
        throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
