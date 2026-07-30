import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API route: Send suspension email via Resend
app.post('/api/send-suspension-email', async (req, res) => {
  try {
    const { email, username, reason, origin } = req.body;

    if (!email || !username) {
      return res.status(400).json({ error: 'Missing email or username parameters.' });
    }

    const appOrigin = origin || process.env.APP_URL || 'https://playxcade.com';
    const appealUrl = `${appOrigin.replace(/\/$/, '')}/appeal`;
    const suspensionReason = reason || 'Violation of Playxcade Community Guidelines & Terms of Service.';

    const resendApiKey = process.env.RESEND_API_KEY;

    // Beautiful HTML Email Template with Garexcell Branding & Appeal Button
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Account Suspension Notice - Playxcade</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 30px auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #c7d2fe; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
        .message { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
        .reason-box { background-color: #0f172a; border-left: 4px solid #f43f5e; padding: 16px 20px; border-radius: 8px; margin-bottom: 28px; }
        .reason-title { font-size: 11px; font-weight: 800; color: #f43f5e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .reason-text { font-size: 13px; font-weight: 600; color: #f1f5f9; margin: 0; }
        .appeal-section { text-align: center; margin: 32px 0 24px 0; }
        .btn-appeal { display: inline-block; background-color: #6366f1; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); transition: all 0.2s ease; }
        .footer { background-color: #0f172a; padding: 24px; text-align: center; border-top: 1px solid #334155; font-size: 11px; color: #64748b; line-height: 1.5; }
        .footer strong { color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PLAYXCADE</h1>
          <p>Trust & Safety Notice</p>
        </div>
        <div class="content">
          <div class="greeting">Hello @${username},</div>
          <div class="message">
            We are writing to inform you that your Playxcade account (<strong>@${username}</strong>) has been <strong>suspended</strong> due to a violation of our Community Guidelines and Terms of Service.
          </div>
          <div class="reason-box">
            <div class="reason-title">Reason for Suspension</div>
            <div class="reason-text">${suspensionReason}</div>
          </div>
          <div class="message">
            While suspended, your social feed access, direct messaging, wallet payouts, and public profile interactions remain disabled.
          </div>
          <div class="appeal-section">
            <a href="${appealUrl}" class="btn-appeal">Submit an Account Appeal</a>
          </div>
          <div style="font-size: 12px; color: #94a3b8; text-align: center;">
            If the button above does not work, visit: <br>
            <a href="${appealUrl}" style="color: #818cf8;">${appealUrl}</a>
          </div>
        </div>
        <div class="footer">
          <p><strong>Garexcell Security & Community Moderation</strong></p>
          <p>Playxcade Ecosystem &copy; 2026 Garexcell Inc. All rights reserved.</p>
          <p>This automated email was sent regarding your Playxcade account standing.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    if (!resendApiKey || resendApiKey === 're_123456789' || resendApiKey.startsWith('re_placeholder')) {
      console.log(`[Resend Service - Demo Mode] Simulating suspension email to ${email} for @${username}`);
      return res.json({
        success: true,
        demoMode: true,
        message: `[Simulated] Suspension email dispatched to ${email}`,
        appealUrl
      });
    }

    const resend = new Resend(resendApiKey);

    const emailResult = await resend.emails.send({
      from: 'Playxcade Moderation <onboarding@resend.dev>',
      to: [email],
      subject: `🚨 Important Notice: Your Playxcade Account Has Been Suspended (@${username})`,
      html: htmlContent
    });

    console.log(`[Resend Service] Suspension email successfully sent to ${email}:`, emailResult);
    return res.json({ success: true, id: emailResult.data?.id, appealUrl });
  } catch (error: any) {
    console.error('[Resend Service Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch suspension email.' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
