const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,   // App Password, not real password
    },
  });

  return transporter;
}

/**
 * Send OTP verification email
 * @param {string} to  - recipient email
 * @param {string} otp - plain 6-digit code
 */
async function sendOTPEmail(to, otp) {
  const transport = getTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#05060a;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05060a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#0d0f18;border:1px solid rgba(99,180,255,0.15);border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(99,180,255,0.1);">
              <p style="margin:0;font-size:11px;letter-spacing:3px;color:#63b4ff;text-transform:uppercase;">
                // digital security audit
              </p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#e8ecf5;">
                Digital Footprint Analyzer
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#6b7a99;line-height:1.6;">
                Your one-time verification code is:
              </p>

              <!-- OTP Box -->
              <div style="text-align:center;margin:28px 0;">
                <div style="display:inline-block;background:#131625;border:1px solid rgba(99,180,255,0.3);
                            border-radius:12px;padding:20px 40px;">
                  <span style="font-family:'Courier New',monospace;font-size:38px;font-weight:700;
                               letter-spacing:12px;color:#63b4ff;">${otp}</span>
                </div>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#6b7a99;text-align:center;">
                This code expires in <strong style="color:#e8ecf5;">${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.
              </p>
              <p style="margin:0;font-size:13px;color:#6b7a99;text-align:center;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(99,180,255,0.08);">
              <p style="margin:0;font-size:11px;color:#3d4a66;text-align:center;">
                Digital Footprint Analyzer · DBMS Security Project
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transport.sendMail({
    from: `"Digital Footprint Analyzer" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${otp} — Your Verification Code`,
    text: `Your Digital Footprint Analyzer verification code is: ${otp}\n\nExpires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
    html,
  });
}

module.exports = { sendOTPEmail };
