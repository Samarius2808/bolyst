import { BrevoClient } from "@getbrevo/brevo";

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY! });

export async function sendFeedbackEmail({
  fromName,
  fromEmail,
  message,
}: {
  fromName: string;
  fromEmail: string;
  message: string;
}) {
  await client.transactionalEmails.sendTransacEmail({
    sender: { name: "Bolyst Feedback", email: "hello@bolyst.eu" },
    to: [{ email: "hello@bolyst.eu" }],
    replyTo: { email: fromEmail, name: fromName },
    subject: `Feedback from ${fromName}`,
    headers: { "X-Mailin-Track": "0", "X-Mailin-Track-Links": "0" },
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #18181b; margin-bottom: 4px;">New feedback</h2>
        <p style="color: #71717a; font-size: 13px; margin-bottom: 24px;">From ${fromName} &lt;${fromEmail}&gt;</p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px 20px; color: #27272a; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message}</div>
      </div>
    `,
  });
}

export async function sendBoardInviteEmail({
  to,
  boardName,
  inviterName,
  signUpUrl,
}: {
  to: string;
  boardName: string;
  inviterName: string;
  signUpUrl: string;
}) {
  await client.transactionalEmails.sendTransacEmail({
    sender: { name: "Bolyst", email: "hello@bolyst.eu" },
    to: [{ email: to }],
    subject: `${inviterName} invited you to "${boardName}" on Bolyst`,
    headers: { "X-Mailin-Track": "0", "X-Mailin-Track-Links": "0" },
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #18181b; margin-bottom: 8px;">Bolyst</h1>
        <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          <strong>${inviterName}</strong> invited you to collaborate on the board <strong>"${boardName}"</strong>.
        </p>
        <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
          Sign up to view the board, add listings, and decide where to live, <span style="color: #55704a; font-weight: 600;">together</span>.
        </p>
        <a href="${signUpUrl}" style="display: inline-block; background: #55704a; color: white; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 600;">
          Sign up &amp; view board
        </a>
        <p style="color: #a1a1aa; font-size: 12px; margin-top: 32px;">
          If you didn't expect this invitation, you can ignore this email.
        </p>
      </div>
    `,
  });
}
