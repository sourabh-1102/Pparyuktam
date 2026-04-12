import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * GET /api/projects/applicants?ids=uuid1,uuid2,...
 * Returns all applications for the given project IDs.
 * Authenticated company users only. Uses supabaseAdmin to bypass RLS.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idsParam = req.nextUrl.searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json({ data: [] });
    }

    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Verify that these projects belong to the requesting user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find(u => u.email === token.email);
    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Security: only return applicants for projects owned by this user
    const { data: ownedProjects } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("company_id", authUser.id)
      .in("id", ids);

    const ownedIds = (ownedProjects || []).map((p: any) => p.id);
    if (ownedIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabaseAdmin
      .from("applications")
      .select(`*, projects(title), teams(*, team_members(*, profiles(*)))`)
      .in("project_id", ownedIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch applicants error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    console.error("GET /api/projects/applicants error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
