import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/projects/my-projects
 * Returns all projects belonging to the authenticated company user.
 * Uses supabaseAdmin to bypass RLS (auth.uid() is null with NextAuth).
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve the Supabase UUID from email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("listUsers error:", listError);
      return NextResponse.json({ error: "Failed to resolve user" }, { status: 500 });
    }

    const authUser = users.find(u => u.email === token.email);
    if (!authUser) {
      return NextResponse.json({ error: "User not found in Supabase" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("company_id", authUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch projects error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    console.error("GET /api/projects/my-projects error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
