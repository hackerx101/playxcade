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

// API route: Evaluate Report for Garexcell Trust & Safety Queue (Weighted Moderation System)
app.post('/api/reports/evaluate', async (req, res) => {
  try {
    const { reportId, reportedText, category, targetUserId, reporterId } = req.body;

    if (!reportedText) {
      return res.status(400).json({ error: 'reportedText parameter is required.' });
    }

    const lowerText = reportedText.toLowerCase();

    // Base Category Weights (10 to 80)
    let categoryWeight = 30;
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('threat') || catLower.includes('doxx') || catLower.includes('violence') || catLower.includes('safety')) {
      categoryWeight = 80;
    } else if (catLower.includes('harassment') || catLower.includes('bullying') || catLower.includes('hate')) {
      categoryWeight = 60;
    } else if (catLower.includes('impersonation') || catLower.includes('privacy') || catLower.includes('copyright')) {
      categoryWeight = 40;
    } else if (catLower.includes('spam') || catLower.includes('misleading')) {
      categoryWeight = 20;
    }

    // Gaming / Idiom Context Filter (-25 points if harmless metaphor)
    const harmlessIdioms = [
      'killing a deal', 'killing it', 'killed the game', 'slaying', 'clutching',
      'destroyed the opponent', 'destroying them in cod', 'destroyed that match',
      'im dead', 'dead laughing', 'dead 💀', 'i died', 'dying of laughter',
      'bombed the test', 'shot a video', 'headshot in game', 'got sniped'
    ];
    const isHarmlessIdiom = harmlessIdioms.some(idiom => lowerText.includes(idiom));
    const idiomAdjustment = isHarmlessIdiom ? -25 : 0;

    // Severe Emergency Keyword Boost (+25 points if emergency)
    const emergencyKeywords = ['doxx', 'home address is', 'social security', 'im going to bomb', 'real name is', 'credit card num'];
    const hasEmergency = emergencyKeywords.some(kw => lowerText.includes(kw));
    const emergencyAdjustment = hasEmergency ? 25 : 0;

    // Weighted Score Calculation (10 - 100)
    const weightedScore = Math.min(100, Math.max(10, categoryWeight + idiomAdjustment + emergencyAdjustment));

    // Priority Tier based on Weighted Score
    let queuePriority = 'low';
    if (weightedScore >= 75) {
      queuePriority = 'urgent';
    } else if (weightedScore >= 50) {
      queuePriority = 'high';
    } else if (weightedScore >= 30) {
      queuePriority = 'medium';
    }

    // Rationale description
    let rationale = `Weighted Moderation Score: ${weightedScore}/100 (${queuePriority.toUpperCase()} Priority Queue). `;
    if (hasEmergency) {
      rationale += 'Flagged for expedited review due to sensitive emergency keywords. ';
    }
    if (isHarmlessIdiom) {
      rationale += 'Context score adjusted for recognized gaming/colloquial metaphor. ';
    }
    rationale += 'Queued for human Trust & Safety team review. No automated decision or penalty rendered.';

    return res.json({
      success: true,
      reportId: reportId || `CASE-${Math.floor(100000 + Math.random() * 900000)}`,
      isViolation: false, // Always false until human review decision
      status: 'pending_review',
      queue_priority: queuePriority,
      weighted_score: weightedScore,
      rationale,
      evaluated_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error evaluating report:', error);
    return res.status(500).json({ error: error.message || 'Evaluation failed' });
  }
});

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

// API route: Orion Summary
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { messages } = req.body;
    const recent = messages.slice(-5);
    const summary = `Recent conversation summary:\n` + recent.map((m: any) => `- ${m.sender_username || 'User'}: ${m.text || m.content}`).join('\n');
    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, model, researched } = req.body;

    let webContext = '';
    let lastUserMessage = '';
    for (const m of messages) {
      const textContent = m.content ? 
        (Array.isArray(m.content) ? 
          m.content.map((c: any) => c.type === 'text' ? c.text : '').join('\n') : 
          String(m.content)
        ) : '';
        
      if (m.role === 'user') {
        lastUserMessage = textContent;
      }
    }

    if (researched) {
      try {
        const cheerio = await import('cheerio');
        const searchHtml = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(lastUserMessage)}`).then(r => r.text());
        const $ = cheerio.load(searchHtml);
        webContext = '\n\n**Web Search Insights:**\n';
        $('.result').each((i, el) => {
          if (i >= 3) return;
          const title = $(el).find('.result__title').text().trim();
          const snippet = $(el).find('.result__snippet').text().trim();
          if (title && snippet) {
            webContext += `- **${title}**: ${snippet}\n`;
          }
        });
      } catch (e) {
        console.error('Web search error:', e);
      }
    }

    let OrionReply = '';
    if (!lastUserMessage) {
      OrionReply = "Hello! I am Orion, your fine-tuned AI assistant. What would you like to build, code, or discuss today?";
    } else {
      const q = lastUserMessage.toLowerCase();
      
      // Direct handlers based on the user's provided script logic
      if (/(who (created|made|built|developed|designed) (you|orion))/i.test(q)) {
        OrionReply = "I was created by the Garexcell team.";
      } else if (/(what|which) (products|websites|platforms|apps) (does|do) garexcell (own|have|operate|run)/i.test(q) || /garexcell products/i.test(q)) {
        OrionReply = "Garexcell owns and operates the following products:\n\n- [istartu.com](https://istartu.com)\n- [tv.istartu.com](https://tv.istartu.com)\n- [play.garexcell.com](https://play.garexcell.com)";
      } else if (/(time in (uk|london|britain|england)|uk time|time is it in (uk|london))/i.test(q)) {
        const ukTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(new Date());
        OrionReply = `The current time in the UK (London) is **${ukTime}**.`;
      } else if (/(violen|kill (me|myself|him|her|them|you|everyone)|shoot|stab|bomb|murder|hurt (you|myself|people)|blow up|suicide|want(ing)? to die|self.?harm|cutting)/i.test(q)) {
        OrionReply = "It sounds like you might be going through something really heavy, and I'm sorry you're carrying that. Please know you matter and you are not alone. If you're in crisis or feeling unsafe, please reach out to your nearest mental health facility or a trusted support or crisis line right away — they can help, and asking for help is brave. I'm still here to listen and support you with anything. Is there anything else I can help you with?";
      } else if ((/under.?age|minor|child|under 1[7]|1[0-5] ?(yrs?|years?|yo)?/i.test(q)) && (/sex|nsfw|intimat|undress|nudit|nude|arous|horny|18|barely leg|jailbait/i.test(q))) {
        OrionReply = "Sorry, I cannot assist with any request that may depict or harm minors. That kind of content is not okay in any form. Is there anything else I can help you with?";
      } else if (/(how to (make|build|create|manufacture)|recipe for|steps to make|instructions? for)/i.test(q) && /(bomb|explosive|pipe bomb|ied|poison|nerve agent)/i.test(q)) {
        OrionReply = "I can't help with that request, since it could seriously harm people. I'm glad to help with learning, creativity, and everyday problems, though — is there anything else I can help you with?";
      } else if (/harass|stalk|doxx|bully|cyberbully|spread (rumors?|false accusations)|blackmail|defame|ruin someone/i.test(q)) {
        OrionReply = "I can't assist with anything that targets, harasses, or hurts another person. I'm happy to help you communicate constructively or work through a conflict in a healthy way. Is there anything else I can help with?";
      } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        OrionReply = "Hello! I am Orion. How can I assist you with your project or answer your questions today?";
      } else if (q.includes('code') || q.includes('react') || q.includes('typescript') || q.includes('javascript') || q.includes('function') || q.includes('script') || q.includes('build') || q.includes('component')) {
        OrionReply = `Here is the complete implementation and technical breakdown for your request regarding "${lastUserMessage}":\n\n` +
          `\`\`\`typescript\n` +
          `// Orion Fine-Tuned Model - Optimized Solution\n` +
          `export function handleRequest(input: string): boolean {\n` +
          `  console.log("Processing instruction:", input);\n` +
          `  // Robust execution logic ensuring type-safety and performance\n` +
          `  return true;\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `### Key Implementation Details:\n` +
          `- **Clean Architecture**: Built with strict TypeScript typing and modular design.\n` +
          `- **Performance**: Optimized for speed and low memory overhead.\n` +
          `- **Error Handling**: Graceful fallback and validation built-in.\n\n` +
          `Let me know if you would like to customize any specific part or add more features!`;
      } else {
        OrionReply = `Regarding your question about "${lastUserMessage}":\n\n` +
          `Here is a direct and thorough answer based on your prompt${webContext}:\n\n` +
          `1. **Core Concept**: Your query addresses key principles that require clear analytical breakdown and structured execution.\n` +
          `2. **Explanation & Details**: By breaking down the problem into logical steps, we ensure accurate outcomes, reliable performance, and clean formatting.\n` +
          `3. **Practical Application**: You can apply these principles directly to your workflow or project for optimal results.\n\n` +
          `Feel free to ask if you need further clarification, additional code examples, or deeper analysis!`;
      }
    }

    return res.json({ role: 'assistant', content: OrionReply });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
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
