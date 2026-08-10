import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

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

    const appOrigin = origin || process.env.APP_URL || 'https://play.garexcell.com';
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
          <p>This automated email was sent regarding your Playxcade account .</p>
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

// API route: Link Metadata Unfurling
app.post('/api/unfurl', async (req, res) => {
  try {
    const { url } = req.body;
    const { getLinkPreview } = await import('link-preview-js');
    const preview = await getLinkPreview(url);
    res.json(preview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API route: Gemini Summary
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
    }
    
    // Simplistic import/usage based on user request to use @google/genai
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    const prompt = `Summarize these 5 recent messages:\n\n${messages.map((m: any) => `${m.sender_username || 'User'}: ${m.text}`).join('\n')}`;
    
    let result;
    const modelCandidates = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-latest'];
    let lastError: any = null;
    for (const modelCandidate of modelCandidates) {
      try {
        result = await ai.models.generateContent({
          model: modelCandidate,
          contents: prompt,
        });
        break;
      } catch (e: any) {
        lastError = e;
        console.warn(`Summarize model ${modelCandidate} failed: ${e.message}. Retrying next candidate...`);
      }
    }

    if (!result) {
      throw lastError || new Error('All model candidates failed');
    }
    
    res.json({ summary: result.text || 'No summary generated.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
    }
    
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    // Extract system message if present
    let systemInstruction = '';
    const chatMessages = [];
    
    for (const m of messages) {
      const textContent = m.content ? 
        (Array.isArray(m.content) ? 
          m.content.map((c: any) => c.type === 'text' ? c.text : '').join('\n') : 
          String(m.content)
        ) : '';
        
      if (m.role === 'system') {
        systemInstruction = textContent;
      } else {
        const role = m.role === 'assistant' ? 'model' : 'user';
        // Check if previous message has the same role and combine if so
        if (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === role) {
          chatMessages[chatMessages.length - 1].parts[0].text += '\n\n' + textContent;
        } else {
          chatMessages.push({
            role,
            parts: [{ text: textContent }]
          });
        }
      }
    }
    
    // Ensure the first message is 'user' for Gemini
    if (chatMessages.length > 0 && chatMessages[0].role === 'model') {
       chatMessages.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }
    
    const requestOptions: any = {
      model: 'gemini-3.6-flash',
      contents: chatMessages,
    };
    
    if (req.body.researched) {
      try {
        const cheerio = await import('cheerio');
        const lastUserMsg = chatMessages[chatMessages.length - 1]?.parts[0]?.text || '';
        const searchHtml = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(lastUserMsg)}`).then(r => r.text());
        const $ = cheerio.load(searchHtml);
        let searchContext = `Web Search Results:\n`;
        $('.result').each((i, el) => {
          if (i >= 5) return;
          searchContext += `- ${$(el).find('.result__title').text().trim()}: ${$(el).find('.result__snippet').text().trim()}\n`;
        });
        chatMessages[chatMessages.length - 1].parts[0].text += `\n\n[SYSTEM NOTE: The user requested a web search. Here are the live results. Use these to answer accurately.]\n${searchContext}`;
      } catch (e) {
        console.error('Web search failed:', e);
      }
    }

    // Incorporate the hidden strict conciseness and zero-conversational-filler instructions
    const systemPrompt = `Strict Instruction: Answer concisely, directly, and only based on the user's inquiry. You are forbidden from using conversational filler, introductory setups, or polite preambles like "Here is the information you requested" or "Sure, I can help with that." Get straight to the point.`.trim();
    const finalSystemInstruction = systemInstruction ? `${systemInstruction}\n\n${systemPrompt}` : systemPrompt;
    
    requestOptions.config = {
      systemInstruction: finalSystemInstruction
    };
    
    let result;
    const modelCandidates = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-latest'];
    let lastError: any = null;
    for (const modelCandidate of modelCandidates) {
      try {
        requestOptions.model = modelCandidate;
        result = await ai.models.generateContent(requestOptions);
        break;
      } catch (e: any) {
        lastError = e;
        console.warn(`Chat model ${modelCandidate} failed: ${e.message}. Retrying next candidate...`);
      }
    }

    if (!result) {
      throw lastError || new Error('All chat model candidates failed');
    }
    
    res.json({ role: 'assistant', content: result.text || 'No response generated.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API route: Cloudflare Calls Proxy
app.post('/api/cloudflare/calls/new', async (req, res) => {
  try {
    const appId = 'ce6166e0362af275b7fce968ceb80ba5';
    const secret = '6e84e6ec389e4153efc2ce7be82bd8ade051426fce5da8643b1f2e7bfcb735c2';
    
    const response = await fetch(`https://rtc.live.cloudflare.com/v1/apps/${appId}/sessions/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  username: string;
  roomId: string;
}

const clients = new Map<WebSocket, ClientConnection>();

// Vite middleware setup
async function startServer() {
  const server = http.createServer(app);

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (messageRaw: string) => {
      try {
        const data = JSON.parse(messageRaw.toString());

        if (data.type === 'register') {
          clients.set(ws, {
            ws,
            userId: data.userId,
            username: data.username,
            roomId: data.roomId || 'general',
          });
          ws.send(JSON.stringify({ type: 'registered', userId: data.userId }));
          return;
        }

        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        let sender = clients.get(ws);
        const senderId = sender?.userId || data.senderId || data.userId || 'unknown';
        const senderUsername = sender?.username || data.senderUsername || data.username || 'User';

        // Relay signaling messages (call-offer, call-answer, ice-candidate, call-end, etc.)
        const payload = {
          ...data,
          senderId,
          senderUsername,
        };

        if (data.targetUserId) {
          let delivered = false;
          for (const [clientWs, clientInfo] of clients.entries()) {
            if (clientInfo.userId === data.targetUserId && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify(payload));
              delivered = true;
            }
          }
          // Fallback if target user not found by ID (or registered under multiple connections): broadcast to all other open sockets
          if (!delivered) {
            for (const [clientWs] of clients.entries()) {
              if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify(payload));
              }
            }
          }
        } else {
          // Broadcast to all other connected clients
          for (const [clientWs] of clients.entries()) {
            if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify(payload));
            }
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // API route: Serve XML Sitemap dynamically
  app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://play.garexcell.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://play.garexcell.com/feed</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://play.garexcell.com/foryou</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://play.garexcell.com/cloud</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://play.garexcell.com/ai</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://play.garexcell.com/explore</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://play.garexcell.com/tos</loc>
    <lastmod>2026-08-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;
    res.send(sitemap);
  });

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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
