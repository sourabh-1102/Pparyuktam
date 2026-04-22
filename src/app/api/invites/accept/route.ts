import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader) {
      const jwtToken = authHeader.replace("Bearer ", "").trim();
      const { data } = await supabaseAdmin.auth.getUser(jwtToken);
      if (data?.user) userId = data.user.id;
    }

    const { token, equity, name, role, skillRole } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // 🔍 Fetch invite
    const { data: invite } = await supabaseAdmin
      .from("team_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ error: "Already used" }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Expired link" }, { status: 400 });
    }

    // ✅ NAME FALLBACK
    const finalName =
      name?.trim() ||
      invite.email?.split("@")[0] ||
      "User";

    // ✅ ROLE SAFE
    const validRoles = ["Member", "Admin", "Leader"];
    const safeRole = validRoles.includes(role) ? role : "Member";

    // ✅ SKILLS ARRAY SAFE
    const skillsArray: string[] =
      typeof skillRole === "string"
        ? skillRole
            .split(",")
            .map((s: string) => s.trim().toLowerCase())
            .filter(Boolean)
        : [];

    // ✅ DUPLICATE CHECK
    const { data: existing } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("team_id", invite.team_id)
      .eq("email", invite.email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already joined",
      });
    }

    // ✅ Resolve Supabase auth user by invite email (if not already resolved via Bearer)
    if (!userId && invite.email) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = users.find((u) => u.email === invite.email);
      if (authUser) userId = authUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found in authentication system. Please sign in first." }, { status: 400 });
    }

    // ✅ FINAL team_members INSERT
    const insertPayload: Record<string, any> = {
      team_id:          invite.team_id,
      project_id:       invite.project_id,
      role:             safeRole,
      skill_role:       skillsArray,
      equity:           Number(equity) || 0,
      finalized_equity: 0,
      name:             finalName,
      email:            invite.email,
    };

    if (userId) insertPayload.user_id = userId;

    console.log("🚀 FINAL INSERT:", insertPayload);

    const { error: memberError } = await supabaseAdmin
      .from("team_members")
      .insert(insertPayload);

    if (memberError) {
      console.error("❌ INSERT ERROR:", memberError);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // ✅ UPDATE profile role to 'Individual' so invited user appears in User Management
    // Only update if we resolved a Supabase user_id for them
    if (userId) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id:        userId,
            user_id:   userId,
            email:     invite.email,
            full_name: finalName,
            role:      "Individual",  // invited users are always students
          },
          { onConflict: "id" }
        );

      if (profileError) {
        // Non-fatal — log but don't fail the join
        console.error("⚠️ Profile upsert after join failed:", profileError.message);
      }
    }

    // ✅ UPDATE INVITE (NO DELETE)
    await supabaseAdmin
      .from("team_invitations")
      .update({ used: true, status: "accepted" })
      .eq("token", token);

    return NextResponse.json({
      success: true,
      message: "Joined successfully",
    });

  } catch (err: any) {
    console.error("🔥 ERROR:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}