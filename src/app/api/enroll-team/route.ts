import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin strictly for edge/server route API handling
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized: No NextAuth session found" }, { status: 401 });
    }

    const body = await req.json();
    const { project_id, team_id } = body;

    if (!project_id || !team_id) {
        return NextResponse.json({ error: "project_id and team_id are required" }, { status: 400 });
    }

    console.log('API RECEIVED TEAM_ID:', team_id);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(team_id)) {
        return NextResponse.json({ error: "Please select a valid team from the list." }, { status: 400 });
    }

    // Securely pull the real UUID from Supabase mapping against NextAuth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find(u => u.email === token.email);
    
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized: No mapped Supabase User found" }, { status: 401 });
    }

    // Insert into applications bypassing client mismatches explicitly using Team workflows
    const { data, error } = await supabaseAdmin.from("applications").insert([{
        project_id: project_id,
        team_id: team_id,
        status: 'pending' // Default enrollment status
    }] as any).select();

    if (error) {
      console.error("Supabase Admin Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("API Error enrolling team in project:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
