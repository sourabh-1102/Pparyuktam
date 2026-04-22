import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { team_id, project_id, email, equity, role } = await req.json();

    if (!team_id || !project_id || !email) {
      return NextResponse.json(
        { error: "team_id, project_id, and email are required" },
        { status: 400 }
      );
    }

    const token = randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitePayload = {
      team_id,
      project_id,
      email,
      token,
      equity: equity ? Number(equity) : 0,
      role: role || "Member",
      status: "pending",
      used: false,
      expires_at: expiresAt.toISOString(),
    };

    console.log("Generated token:", token);
    console.log("Creating invite with payload:", invitePayload);

    const { data: invite, error } = await supabaseAdmin
      .from("team_invitations")
      .insert(invitePayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase Admin Insert Error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to create invite", details: error },
        { status: 500 }
      );
    }

    const inviteUrl = `http://localhost:8080/join?token=${token}`;

    return NextResponse.json(
      { success: true, url: inviteUrl, token },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Catch block Error:", JSON.stringify(err, null, 2));
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}