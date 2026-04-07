export function passwordResetEmail(
  name: string,
  resetLink: string,
): { subject: string; html: string } {
  const subject = 'Reset your password'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:32px 40px;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">OAuth Sample</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:24px;font-weight:600;color:#18181b;letter-spacing:-0.5px;">Reset your password</p>
              <p style="margin:0 0 24px;font-size:15px;color:#71717a;line-height:1.6;">
                Hi ${name}, we received a request to reset the password for your account.
                Click the button below to choose a new password. This link expires in <strong>15 minutes</strong>.
              </p>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#18181b;border-radius:6px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;letter-spacing:0.1px;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 32px;font-size:13px;word-break:break-all;">
                <a href="${resetLink}" style="color:#18181b;">${resetLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 24px;" />

              <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will not be changed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                © OAuth Sample · This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
