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

    // Capture the payload payload
    const body = await req.json();

    // Securely pull the real UUID from Supabase mapping against NextAuth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users?.find(u => u.email === token.email);
    
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized: No mapped Supabase User found" }, { status: 401 });
    }

    const companyId = authUser.id;
    
    // Inject secure server-side ID enforcing Data Integrity
    const payload = { ...body, company_id: companyId, status: "open" };

    // Insert as Admin bypassing client RLS disconnects
    const { data, error } = await supabaseAdmin.from("projects").insert([payload]).select();

    if (error) {
      console.error("Supabase Admin Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("API Error saving project:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
