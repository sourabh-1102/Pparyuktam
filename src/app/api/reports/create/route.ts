import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve real user UUID from profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", token.email)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { reported_entity_type, reported_entity_id, reason, description } = body;

    if (!reported_entity_type || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (reported_entity_type !== "general" && !reported_entity_id) {
      return NextResponse.json({ error: "Missing reported_entity_id for specific report" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("reports").insert({
      reported_by: profile.id,
      reported_entity_type,
      reported_entity_id: reported_entity_id || "00000000-0000-0000-0000-000000000000",
      reason,
      description,
      status: "Pending"
    });

    if (error) {
       console.error("Report creation error:", error);
       throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/reports/create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
