export const passwordResetTemplate = (resetUrl: string): string => `
<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#f9f9f9;padding:32px;">
    <div style="background:#fff;padding:32px;max-width:520px;margin:0 auto;">
      <h1 style="color:#000;margin:0 0 16px;">Timsrael Clothing</h1>
      <hr style="border-color:#eee;margin:16px 0;" />
      <h2 style="color:#000;">Password Reset Request</h2>
      <p style="color:#444;line-height:1.6;">
        You requested a password reset. Click the button below to reset your password.
        This link expires in 15 minutes.
      </p>
      
        href="${resetUrl}"
        style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:16px 0;"
      >
        Reset Password
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>
`;