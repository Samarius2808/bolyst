const brevo = require("@getbrevo/brevo");

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

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
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = { name: "Bolyst", email: "hello@bolyst.eu" };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = `${inviterName} invited you to "${boardName}" on Bolyst`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 24px; font-weight: 700; color: #18181b; margin-bottom: 8px;">Bolyst</h1>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        <strong>${inviterName}</strong> invited you to collaborate on the board <strong>"${boardName}"</strong>.
      </p>
      <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
        Bolyst helps you find apartments together. Sign up to view the board, add listings, and decide where to live.
      </p>
      <a href="${signUpUrl}" style="display: inline-block; background: #55704a; color: white; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 600;">
        Sign up &amp; view board
      </a>
      <p style="color: #a1a1aa; font-size: 12px; margin-top: 32px;">
        If you didn't expect this invitation, you can ignore this email.
      </p>
    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
}
