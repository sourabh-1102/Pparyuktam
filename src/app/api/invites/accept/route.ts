import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

// Initialize Supabase Admin strictly for server-side logic
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    // 1. TOKEN LOOKUP
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from("team_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (inviteErr || !invite) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // 2. VALIDATION
    if (invite.status === "accepted" || invite.used === true) {
      return NextResponse.json({ error: "Invite already used" }, { status: 400 });
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    // 3. USER RESOLUTION
    const sessionToken = await getToken({ req });
    if (!sessionToken?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", sessionToken.email)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "User profile not found. Please complete onboarding first." }, { status: 404 });
    }

    const userId = profile.id;

    // 4. DUPLICATE CHECK
    const { data: existingMember } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("team_id", invite.team_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: "Already a team member" }, { status: 400 });
    }

    // 5. TRANSACTION (Atomic emulation & Data Consistency)
    // Create valid JSONB contact info structure
    const contactInfo = {
      email: profile.email || sessionToken.email,
      name: profile.full_name || sessionToken.name || "Unknown",
      joined_at: new Date().toISOString()
    };

    // First: Update team_invitations
    const { data: grabbedInvite, error: updateErr } = await supabaseAdmin
      .from("team_invitations")
      .update({
        status: "accepted",
        used: true,
        contact_info: contactInfo
      })
      .eq("id", invite.id)
      .eq("used", false) 
      .select()
      .maybeSingle();

    if (updateErr || !grabbedInvite) {
      return NextResponse.json({ error: "Failed to claim invite. It may have just been used." }, { status: 400 });
    }

    // Second: Insert into team_members
    const { error: insertErr } = await supabaseAdmin
      .from("team_members")
      .insert({
        team_id: invite.team_id,
        user_id: userId,
        role: invite.role,    // MUST come from invite record securely
        equity: invite.equity // MUST come from invite record securely
      });

    if (insertErr) {
      // Rollback the invite claim if insert failed
      await supabaseAdmin
        .from("team_invitations")
        .update({
          status: "pending",
          used: false,
          contact_info: null
        })
        .eq("id", invite.id);

      console.error("Team member insert error:", insertErr);
      return NextResponse.json({ error: "Failed to join team." }, { status: 500 });
    }

    // 7. TEAM LEADER INFO
    // We join the created_by UUID with profiles to resolve their full name and avatar.
    const { data: leaderProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", invite.created_by)
      .maybeSingle();

    // 8. RESPONSE FORMAT
    return NextResponse.json({
      success: true,
      team_id: invite.team_id,
      leader: {
        name: leaderProfile?.full_name || "Team Leader",
        avatar: leaderProfile?.avatar_url || null
      }
    });

  } catch (error: any) {
    console.error("Invite Accept Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
