import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvite(
  toEmail: string,
  projectName: string,
  inviteLink: string,
  fromEmail: string = "no-reply@paryuktam.com" // Update to your verified Resend domain
) {
  try {
    const data = await resend.emails.send({
      from: `Paryuktam <${fromEmail}>`,
      to: [toEmail],
      subject: `You've been invited to join ${projectName} on Paryuktam`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Paryuktam</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333333; margin-top: 0;">Hello,</p>
            <p style="font-size: 16px; color: #333333; line-height: 1.5;">
              You have been invited to join the project <strong>${projectName}</strong> on Paryuktam. 
              Click the button below to accept the invitation and view the project details.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                View Invitation
              </a>
            </div>
            <p style="font-size: 14px; color: #666666; margin-bottom: 0;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              © ${new Date().getFullYear()} Paryuktam. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send invite email", error);
    return { success: false, error };
  }
}
