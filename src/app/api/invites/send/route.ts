import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { method, contactInfo, teamId, inviterId, teamName } = await request.json();

    if (!method || !contactInfo) {
      return NextResponse.json({ error: 'contactInfo and method are required' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured (RESEND_API_KEY missing)' }, { status: 500 });
    }

    // Generate a stateless token encoding the invite details
    const tokenPayload = {
      teamId: teamId || 'unknown',
      email: contactInfo,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    const generatedToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:8080'}/join?token=${generatedToken}`;
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
