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

    // Retrieve users
    const { data: users, error } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, role, company_name, industry, created_at, is_admin")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch users error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Optional POST endpoint to block/unblock or delete
export async function POST(req: NextRequest) {
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

    const { targetUserId, action } = await req.json();

    if (!targetUserId || !action) {
         return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    if (action === "delete") {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        // Supabase foreign keys usually handle cascade deletes for profiles if properly set
        if (error) throw error;
    }

    // If 'ban', supabase currently supports updating auth user attributes for ban logic, 
    // but a common pattern is adding an 'is_banned' column. We will skip complex ban logic in this API
    // unless strictly required, focusing just on raw deletion or metadata flagging.

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
