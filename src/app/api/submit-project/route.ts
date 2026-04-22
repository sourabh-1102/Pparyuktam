import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { project_id, url } = body;

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find(u => u.email === token.email);
    
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert into submissions table
    const { error } = await supabaseAdmin.from('submissions').insert([{
        project_id: project_id,
        user_id: authUser.id,
        url: url,
        status: 'under_review'
    }] as any);

    if (error) throw error;

    return NextResponse.json({ message: "Project submitted successfully!" }, { status: 200 });

  } catch (err: any) {
    console.error("Submission error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit project." }, { status: 500 });
  }
}
