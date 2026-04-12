import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin strictly for edge/server route API handling
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized: No NextAuth session found" }, { status: 401 });
    }

    const body = await req.json();
    const { application_id, project_id, team_id, status } = body;

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find(u => u.email === token.email);
    
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized: No mapped Supabase User found" }, { status: 401 });
    }

    // 1. Update the application status
    const { error: appError } = await supabaseAdmin
        .from('applications')
        .update({ status: status })
        .eq('id', application_id);
    
    if (appError) throw appError;

    if (status === 'accepted') {
        // 2. Reject all other pending applications for this project
        await supabaseAdmin.from('applications')
           .update({ status: 'rejected' })
           .eq('project_id', project_id)
           .neq('id', application_id);

        // 3. Create a row in project_assignments
        const { error: paError } = await supabaseAdmin
           .from('project_assignments')
           .insert([{ project_id: project_id, team_id: team_id, company_id: authUser.id }]);
        
        if (paError) throw paError;

        // 4. Update the projects table to 'in_progress'
        const { error: pError } = await supabaseAdmin
           .from('projects')
           .update({ status: 'in_progress' })
           .eq('id', project_id);

        if (pError) throw pError;
    }

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (err: any) {
    console.error("API Error marking application:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
