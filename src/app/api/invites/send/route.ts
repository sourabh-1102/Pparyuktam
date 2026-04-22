import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { method, contactInfo, teamId, projectId, inviterId, teamName } = await request.json();

    if (!method || !contactInfo) {
      return NextResponse.json({ error: 'contactInfo and method are required' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured (RESEND_API_KEY missing)' }, { status: 500 });
    }
    // Generate a UUID token and insert into DB
    const token = randomUUID();
    
    if (supabaseAdmin) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitePayload = {
        team_id: teamId || 'unknown',
        project_id: projectId || null,
        email: contactInfo,
        token,
        equity: 0,
        role: "Member",
        status: "pending",
        used: false,
        expires_at: expiresAt.toISOString(),
      };

      console.log("Generated token from send route:", token);

      const { error: dbError } = await supabaseAdmin
        .from("team_invitations")
        .insert(invitePayload);

      if (dbError) {
        console.error("Supabase Admin Insert Error in send route:", JSON.stringify(dbError, null, 2));
        return NextResponse.json({ error: 'Failed to create invitation record' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:8080');
    const inviteUrl = `${baseUrl}/join?token=${token}`;
    const resolvedTeamName = teamName || 'a team';

    if (method === 'Email') {
      const { data, error } = await resend.emails.send({
        from: 'Paryuktam <onboarding@resend.dev>',
        to: [contactInfo],
        subject: `You've been invited to join ${resolvedTeamName} on Paryuktam`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">Team Invitation 🚀</h2>
            <p style="color: #555; margin-bottom: 24px;">
              You've been invited to join <strong>${resolvedTeamName}</strong> on Paryuktam — a platform where student teams collaborate on real company projects.
            </p>
            <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Accept Invitation →
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">This link expires in 7 days. If you didn't expect this, you can ignore it.</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
      }

      console.log('Email sent:', data);
    } else if (method === 'SMS' || method === 'WhatsApp') {
      // Placeholder — integrate MSG91/Twilio here
      console.log(`[${method}] Invite to ${contactInfo}: ${inviteUrl}`);
    }

    return NextResponse.json({ success: true, message: 'Invitation sent successfully' });
  } catch (error: any) {
    console.error('Invite API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
