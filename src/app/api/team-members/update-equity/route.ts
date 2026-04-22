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

    const { members } = await req.json();

    if (!members || !Array.isArray(members)) {
      return NextResponse.json({ error: "Invalid payload: members array required" }, { status: 400 });
    }

    // Validation: Total equity constraint
    const totalEquity = members.reduce((sum: number, m: any) => sum + (Number(m.equity) || 0), 0);
    
    // Strict business rule: equity constraints
    if (totalEquity > 100) {
      return NextResponse.json({ error: "Total equity exceeds 100%" }, { status: 400 });
    }

    // Optional Check: individual negatives or over 100
    for (const m of members) {
        if (m.equity < 0 || m.equity > 100) {
            return NextResponse.json({ error: "Individual equity must be between 0 and 100" }, { status: 400 });
        }
    }

    // Execute bulk update using iteration (Admin loop)
    for (const m of members) {
      const { error } = await supabaseAdmin
        .from("team_members")
        .update({ equity: Number(m.equity) })
        .eq("id", m.id);

      if (error) {
        console.error(`Failed to update equity for member ${m.id}:`, error);
        return NextResponse.json({ error: `DB Error on member ${m.id}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/team-members/update-equity error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
