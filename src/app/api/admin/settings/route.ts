import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";
import type { PlatformSettings } from "@/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = ["govindsingh100bn@gmail.com", "jatsourabhsinghgovindsingh@gmail.com"];

async function verifyAdmin(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.email) return null;
  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("email", token.email).single();
  if (!profile?.is_admin && !ADMIN_EMAILS.includes((token.email || "").toLowerCase())) return null;
  return token;
}

export async function GET(req: NextRequest) {
  try {
    const adminToken = await verifyAdmin(req);
    if (!adminToken) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Fetch settings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (err: any) {
    console.error("GET /api/admin/settings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminToken = await verifyAdmin(req);
    if (!adminToken) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { allow_students, allow_companies, auto_approve } = body as Partial<PlatformSettings>;

    const { error } = await supabaseAdmin
      .from("settings")
      .upsert(
        {
          id: 1,
          allow_students: allow_students ?? true,
          allow_companies: allow_companies ?? true,
          auto_approve: auto_approve ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Upsert settings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/admin/settings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
