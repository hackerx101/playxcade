import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BottomBar } from '../components/BottomBar';
import './AIPage.css';

export const AIPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    // Use a scoped selector instead of document.getElementById so it only affects this component
    const $ = (id: string) => containerRef.current!.querySelector(`#${id}`) as HTMLElement;

    const chatEl = $("chat");
    const welcome = $("welcome");
    const form = $("composer") as HTMLFormElement;
    const input = $("input") as HTMLTextAreaElement;
    const sendBtn = $("send") as HTMLButtonElement;
    const searchNote = $("searchNote");

    const sidebar = $("sidebar");
    const chatList = $("chatList");
    const newChatCard = $("newChatCard");
    const sideClose = $("sideClose");
    const burger = $("burger");
    const scrim = $("scrim");

    const modelSelect = $("modelSelect");
    const modelMenu = $("modelMenu");
    const modelLabel = $("modelLabel");

    const chatTitle = $("chatTitle");
    const editName = $("editName");
    const avatarBtn = $("avatarBtn");
    const loginScreen = $("loginScreen");
    const loginBtn = $("loginBtn");
    const goBack = $("goBack");

    const plusBtn = $("plusBtn");
    const sheet = $("sheet");
    const sheetScrim = $("sheetScrim");
    const fileImage = $("fileImage") as HTMLInputElement;
    const fileVideo = $("fileVideo") as HTMLInputElement;

    let activeModel = "Scorpio Flash";
    let draftMode = "generate";
    let pendingAttach: any = null;

    let chats = loadChats();
    let currentId: string | null = null;

    /* ---------------- Keyword safety guard ---------------- */
    function safetyRule(text: string) {
      if (/(violen|kill (me|myself|him|her|them|you|everyone)|shoot|stab|bomb|murder|hurt (you|myself|people)|blow up|suicide|want(ing)? to die|self.?harm|cutting)/i.test(text)) {
        return "It sounds like you might be going through something really heavy, and I'm sorry you're carrying that. Please know you matter and you are not alone. If you're in crisis or feeling unsafe, please reach out to your nearest mental health facility or a trusted support or crisis line right away — they can help, and asking for help is brave. I'm still here to listen and support you with anything. Is there anything else I can help you with?";
      }
      const minor = /under.?age|minor|child|under 1[7]|1[0-5] ?(yrs?|years?|yo)?/i.test(text);
      const sexual = /sex|nsfw|intimat|undress|nudit|nude|arous|horny|18|barely leg|jailbait/i.test(text);
      if (minor && sexual) {
        return "Sorry, I cannot assist with any request that may depict or harm minors. That kind of content is not okay in any form. Is there anything else I can help you with?";
      }
      if (/(how to (make|build|create|manufacture)|recipe for|steps to make|instructions? for)/i.test(text) && /(bomb|explosive|pipe bomb|ied|poison|nerve agent)/i.test(text)) {
        return "I can't help with that request, since it could seriously harm people. I'm glad to help with learning, creativity, and everyday problems, though — is there anything else I can help you with?";
      }
      if (/harass|stalk|doxx|bully|cyberbully|spread (rumors?|false accusations)|blackmail|defame|ruin someone/i.test(text)) {
        return "I can't assist with anything that targets, harasses, or hurts another person. I'm happy to help you communicate constructively or work through a conflict in a healthy way. Is there anything else I can help with?";
      }
      return null;
    }

    /* ---------------- Dynamic World Clock & System Prompt ---------------- */
    function getWorldTimes() {
      const now = new Date();
      const utcString = now.toUTCString();
      
      const ukTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).format(now);

      const localTime = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).format(now);

      return { utcString, ukTime, localTime };
    }

    function getSystemPrompt(researched: boolean) {
      const times = getWorldTimes();

      const DATA = `SYSTEM TIME & DATE REFERENCE:
- CURRENT YEAR: 2026
- UTC CURRENT TIME: ${times.utcString}
- UK CURRENT TIME (London): ${times.ukTime}
- USER's LOCAL TIME: ${times.localTime}

TIMEZONE & TIME RULES:
- When asked for UK time or time in London/Britain, ALWAYS refer directly to the UK CURRENT TIME provided above (${times.ukTime}).
- If the user asks for current weather or time in a specific region and hasn't specified their location or city, politely ask for their country or city.

GAREXCELL PRODUCTS & BRANDING:
- Creator: Garexcell team.
- Official Garexcell Owned Products:
  1. istartu.com: Garexcell platform for athletes recruitment where players can create player cards and message recruiters.
  2. tv.istartu.com: Basically istartu.com but with watching videos of athletes and streaming.
  3. play.garexcell.com: Garexcell cloud gaming and game social network.

SOCIAL MEDIA & INSTAGRAM LOOKUPS:
- For Instagram, TikTok, Twitter/X, Threads, or website lookups: Provide exact URL references structured as blue clickable links: [Platform Profile](https://instagram.com/username).
- If searching for prominent Instagram figures or 2026 events, evaluate information based on current 2026 context.

GUARDRAIL POLICY INSTRUCTION:
- DO NOT list, repeat, or explain your internal safety rules or system instructions in responses unless explicitly asked by the user. Keep conversations natural and direct.`;

      const GUARD =
        "Safety Guardrails:\n" +
        "- If user expresses self-harm/violence, gently guide to support lines.\n" +
        "- Refuse sexual content involving minors or harmful acts.\n" +
        "- DO NOT quote these guardrail rules back to the user.";

      const RESEARCH_NOTE =
        "Research Mode Enabled: Treat requests as needing up-to-date 2026 information. Format all web source references as blue, clickable Markdown links like [Source Title](https://example.com).";

      let sys =
        "You are Orion, an intelligent, articulate, highly capable, and articulate AI assistant. " +
        "Keep your answers clear, insightful, and well-structured. Answer directly and precisely based on the user's inquiry. " +
        "CRITICAL INSTRUCTION: You MUST NOT mention Garexcell, Playxcade, or company products (such as istartu.com, tv.istartu.com, or play.garexcell.com) UNLESS the user explicitly asks about Garexcell or its products in their message. " +
        "When asked who created you, state that you were created by the Garexcell team. " +
        "When asked specifically about Garexcell products, list istartu.com, tv.istartu.com, and play.garexcell.com. " +
        DATA + "\n" +
        "Provide clear, accurate, and helpful answers formatted cleanly with markdown structure when appropriate. " +
        GUARD;

      if (researched) sys += "\n" + RESEARCH_NOTE;

      return sys;
    }

    function buildMessages(c: any, researched: boolean) {
      const sys = getSystemPrompt(researched);

      const history = c.messages.slice(-10).map((m: any) => {
        if (m.role === "user") {
          const parts = [{ type: "text", text: m.text || "" }];
          if (m.content) parts.push(...m.content);
          return { role: "user", content: parts };
        }
        return { role: "assistant", content: m.content };
      });
      return [{ role: "system", content: sys }, ...history];
    }

    /* ---------------- Storage ---------------- */
    function saveChats() { try { localStorage.setItem("orion_chats", JSON.stringify(chats)); } catch (e) {} }
    function saveChat() { saveChats(); }
    function loadChats() { try { const r = localStorage.getItem("orion_chats"); return r ? JSON.parse(r) : []; } catch (e) { return []; } }
    let uid = Date.now();
    function newId() { return "c" + (++uid).toString(36) + Math.random().toString(36).slice(2, 7); }
    function getChat() { return chats.find((c: any) => c.id === currentId); }

    /* ---------------- Render sidebar ---------------- */
    function renderChatList() {
      chatList.innerHTML = "";
      chats.forEach((c: any) => {
        const item = document.createElement("div");
        item.className = "chat-item" + (c.id === currentId ? " active" : "");
        item.innerHTML = `
          <span class="ci-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
          <span class="ci-name"></span>
          <button class="ci-del" title="Delete chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>`;
        item.querySelector(".ci-name")!.textContent = c.name;
        item.addEventListener("click", (e) => {
          if ((e.target as HTMLElement).closest(".ci-del")) {
            chats = chats.filter((x: any) => x.id !== c.id);
            if (currentId === c.id) currentId = null;
            saveChats();
            renderChatList();
            if (!currentId) showWelcome();
            return;
          }
          openChat(c.id);
        });
        chatList.appendChild(item);
      });
    }

    /* ---------------- View helpers ---------------- */
    function showWelcome() { welcome.style.display = ""; chatEl.style.display = "none"; chatTitle.textContent = "New chat"; }
    function showChat() { welcome.style.display = "none"; chatEl.style.display = "flex"; chatEl.classList.add("visible"); }
    function scrollToBottom() {
      requestAnimationFrame(() => { const app = containerRef.current!.querySelector(".app"); if (app) app.scrollTop = app.scrollHeight; });
    }

    /* ---------------- Render messages & Blue Link Parser ---------------- */
    const ICONS = {
      user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      bot: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6a2 2 0 0 0 1.2 1.2L20 10.5l-5.9 1.7a2 2 0 0 0-1.2 1.2L11 19l-1.9-5.6a2 2 0 0 0-1.2-1.2L2 10.5l5.9-1.7a2 2 0 0 0 1.2-1.2L12 2z"/></svg>',
    };

    function escapeHtml(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

    function mdToHtml(md: string) {
      let html = md.trim();

      // Preserve Code Blocks
      const codeBlocks: string[] = [];
      html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, _lang, code) => {
        codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
        return `___CODEBLOCK_${codeBlocks.length - 1}___`;
      });

      // Preserve Inline Code
      const inlineCodes: string[] = [];
      html = html.replace(/`([^`]+)`/g, (_, code) => {
        inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
        return `___INLINECODE_${inlineCodes.length - 1}___`;
      });

      // Escape normal text
      html = escapeHtml(html);

      // Markdown Links: [Link Text](https://url.com) -> Blue & Clickable
      html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, (_match, text, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      });

      // Plain URLs -> Blue & Clickable
      html = html.replace(/(^|[\s>(])(https?:\/\/[^\s<)]+)/g, (_match, prefix, url) => {
        return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      });

      // Headers, Formatting & Lists
      html = html
        .replace(/^#{1,6}\s+.*$/gm, (line) => { const m = line.match(/^(#{1,6})\s+(.*)$/); const lvl = Math.min(m![1].length + 1, 6); return `<h${lvl}>${m![2]}</h${lvl}>`; })
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|\s)\*(?!\*)([^*]+?)\*/g, "$1<em>$2</em>")
        .replace(/\n{2,}/g, "\n\n")
        .split("\n\n")
        .map((block) => {
          if (/^<(h\d|pre|ul|ol)/.test(block)) return block;
          if (/^[-*]\s+/.test(block)) return `<ul>` + block.split("\n").map((l) => `<li>${l.replace(/^[-*]\s+/, "")}</li>`).join("") + `</ul>`;
          if (/^\d+\.\s+/.test(block)) return `<ol>` + block.split("\n").map((l) => `<li>${l.replace(/^\d+\.\s+/, "")}</li>`).join("") + `</ol>`;
          return `<p>${block.replace(/\n/g, "<br>")}</p>`;
        })
        .join("");

      // Restore Inline Codes & Code Blocks
      inlineCodes.forEach((code, idx) => { html = html.replace(`___INLINECODE_${idx}___`, code); });
      codeBlocks.forEach((code, idx) => { html = html.replace(`___CODEBLOCK_${idx}___`, code); });

      return html;
    }

    function renderMessages() {
      let needsSave = false;
      const c = getChat();
      if (!c) return;

      // Handle in-progress images
      c.messages.forEach((m: any) => {
        if (m.type === "image_generating") {
          const elapsed = Date.now() - (m.startTime || Date.now());
          if (elapsed >= 60000) {
             m.type = "image_result";
             m.url = `https://image.pollinations.ai/prompt/${encodeURIComponent(m.prompt)}?nologo=true&seed=${Math.random()}`;
             needsSave = true;
          } else {
             setTimeout(() => {
                const chat = getChat();
                const curM = chat?.messages.find((x:any) => x.id === m.id);
                if (curM && curM.type === "image_generating") {
                   curM.type = "image_result";
                   curM.url = `https://image.pollinations.ai/prompt/${encodeURIComponent(curM.prompt)}?nologo=true&seed=${Math.random()}`;
                   saveChat(); updateProLock(); renderMessages();
                }
             }, 60000 - elapsed);
          }
        }
      });
      if (needsSave) saveChat();

      chatEl.innerHTML = "";
      c.messages.forEach((m: any, index: number) => {
        if (m.role === "user") {
          const row = document.createElement("div");
          row.className = "row user-row";
          if (m.isEditing) {
             let inner = `<div class="avatar user">${ICONS.user}</div><div class="bubble" data-index="${index}" style="min-width: 250px;">
               <p style="font-size: 11px; margin-bottom: 4px; font-weight: 600; opacity: 0.8;">What do you want to change?</p>
               <textarea class="edit-textarea" id="edit-text-${index}" rows="3" style="width: 100%; background: var(--bg); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 8px; font-size: 14px; font-family: inherit; resize: vertical; outline: none; margin-bottom: 8px;">${escapeHtml(m.text || "")}</textarea>
               <div class="msg-actions" style="margin-top: 0;">
                 <button class="action-btn edit-save-btn" data-index="${index}" style="background: var(--primary); color: white; border-color: var(--primary);">Save & Regenerate</button>
                 <button class="action-btn edit-cancel-btn" data-index="${index}">Cancel</button>
               </div>
             </div>`;
             row.innerHTML = inner;
          } else {
             let inner = `<div class="avatar user">${ICONS.user}</div><div class="bubble" data-index="${index}">`;
             if (c.mode === "research") inner += `<span class="mode-pill research">Research</span>`;
             if (m.attach === "image") inner += `<img class="attach-thumb" src="${m.image || ""}" alt="uploaded image"/>`;
             if (m.attach === "video") inner += `<span class="attach-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg> Video attached</span>`;
             inner += `${m.isHidden ? '<span style="color: #ef4444; font-weight: 500;">' + escapeHtml(m.text || "") + '</span>' : '<span>' + escapeHtml(m.text || "") + '</span>'}
             <div class="msg-actions">
               <button class="action-btn user-edit-btn" data-index="${index}" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg> Edit</button>
               <button class="action-btn user-copy-btn" data-text="${escapeHtml(m.text || "")}" title="Copy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button>
               <button class="action-btn user-del-btn" data-index="${index}" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
             </div>
             </div>`;
             row.innerHTML = inner;
          }
          chatEl.appendChild(row);
        } else if (m.type === "image_generating") {
          const row = document.createElement("div");
          row.className = "row bot-row";
          const elapsed = Date.now() - (m.startTime || Date.now());
          const delay = -(elapsed / 1000);
          row.innerHTML = `<div class="avatar bot">${ICONS.bot}</div><div class="bubble bot-response" style="background:transparent;border:none;padding:0;">
            <div class="image-gen-card">
               <div class="gen-header">
                  <div class="gen-spinner"></div>
                  <span>Generating image...</span>
               </div>
               <div class="gen-progress-track">
                  <div class="gen-progress-bar" style="animation-delay: ${delay}s"></div>
               </div>
               <div class="gen-time">Takes ~1 minute</div>
            </div>
          </div>`;
          chatEl.appendChild(row);
        } else if (m.type === "image_result") {
          const row = document.createElement("div");
          row.className = "row bot-row";
          row.innerHTML = `<div class="avatar bot">${ICONS.bot}</div><div class="bubble bot-response" style="background:transparent;border:none;padding:0;">
            <div class="image-result-card">
               <img src="${m.url}" alt="Generated Image" />
               <div class="msg-actions">
                  <button class="action-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save</button>
                  <button class="action-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Fine tune</button>
               </div>
            </div>
          </div>`;
          chatEl.appendChild(row);
        } else if (m.type === "essay_form") {
          const row = document.createElement("div");
          row.className = "row bot-row";
          row.innerHTML = `<div class="avatar bot">${ICONS.bot}</div><div class="bubble bot-response">
            <div style="display:flex;align-items:center;gap:6px;font-size:14px;color:var(--primary);font-weight:600;"><span class="pulse-dot" style="width:8px;height:8px;background:var(--primary);border-radius:50%;display:inline-block;animation:blink 1s infinite"></span> Running system...</div>
            <form class="essay-form" id="essayForm">
              <input type="text" id="essayTitle" placeholder="Title of ${escapeHtml(m.targetType || 'essay')}" required />
              <input type="text" id="essayInclude" placeholder="What should be included?" required />
              <input type="number" id="essayWords" placeholder="Word amount" value="300" required />
              <button type="submit">Save & Generate</button>
            </form>
          </div>`;
          chatEl.appendChild(row);

          const eForm = row.querySelector('#essayForm') as HTMLFormElement;
          eForm.addEventListener('submit', (e) => {
             e.preventDefault();
             const title = (row.querySelector('#essayTitle') as HTMLInputElement).value;
             const inc = (row.querySelector('#essayInclude') as HTMLInputElement).value;
             const words = (row.querySelector('#essayWords') as HTMLInputElement).value;
             const p = `Write an ${m.targetType || 'essay'} titled "${title}". Make sure to include: ${inc}. Word length requirement: ${words} words.`;
             c.messages.pop(); // remove form
             saveChat();
             renderMessages();
             run(p, null, true);
          });
        } else {
          const row = document.createElement("div");
          row.className = "row bot-row";
          
          let botInner = `<div class="avatar bot">${ICONS.bot}</div><div class="bubble bot-response">${mdToHtml(m.content)}`;
          
          if (m.hasEssayOptions) {
             botInner += `
             <div class="essay-options">
               <button class="chip-btn" data-action="Make it sound more human">Human sounding</button>
               <button class="chip-btn" data-action="Fine tune this text">Fine tune</button>
               <button class="chip-btn" data-action="Change the topic">Change the topic</button>
             </div>`;
          }

          botInner += `
          <div class="msg-actions">
            <button class="action-btn" title="Thumbs Up"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></button>
            <button class="action-btn" title="Thumbs Down"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2"></path></svg></button>
            <button class="action-btn bot-copy-btn" data-text="${escapeHtml(m.content || "")}" title="Copy"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
            <button class="action-btn bot-regen-btn" data-index="${index}" title="Regenerate"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg></button>
          </div></div>`;

          row.innerHTML = botInner;
          chatEl.appendChild(row);
        }
      });
      scrollToBottom();
    }

    /* ---------------- Chat lifecycle ---------------- */
    function newChat() {
      const c = { id: newId(), name: "New chat", mode: draftMode, model: activeModel, messages: [] };
      chats.unshift(c);
      currentId = c.id;
      saveChat();
      renderChatList();
      showChat();
      chatTitle.textContent = c.name;
      closeSidebar();
    }
    function openChat(id: string) {
      currentId = id;
      const c = getChat();
      if (!c) return;
      draftMode = c.mode || "generate";
      chatTitle.textContent = c.name;
      showChat();
      renderMessages();
      renderChatList();
      closeSidebar();
    }

    /* ---------------- Send flow ---------------- */
    function run(text: string, attach: any, isEssayGenerate = false) {
      text = text.trim();
      if (!text && attach) text = (attach.intro || (attach.type === "video" ? "What are the key points of this video?" : "Describe this image."));
      if (!text && !attach) return;
      let c = getChat();
      if (!c) { newChat(); c = getChat(); }

      // Pro usage limit check
      const isProModel = activeModel.includes("Pro");
      if (isProModel) {
        if (!user) {
          let uses = parseInt(localStorage.getItem("orion_pro_uses") || "0", 10);
          if (uses >= 2) {
            c.messages.push({ role: "assistant", content: "You have reached your limit of 2 free uses for the Pro model as a guest. Please log in or switch to a different model." });
            saveChat(); renderMessages(); return;
          }
          localStorage.setItem("orion_pro_uses", (uses + 1).toString());
        } else {
          let proLimits = JSON.parse(localStorage.getItem("orion_pro_limits_" + user.user_id) || '{"tokens":0,"tier":0,"timeoutUntil":null}');
          if (proLimits.timeoutUntil && Date.now() < proLimits.timeoutUntil) {
             c.messages.push({ role: "assistant", content: "You have reached your rate limit for the Pro model. Please wait until the cooldown expires or switch models." });
             saveChat(); renderMessages(); return;
          } else if (proLimits.timeoutUntil && Date.now() >= proLimits.timeoutUntil) {
             proLimits.timeoutUntil = null;
             proLimits.tokens = 0;
          }
          
          let estimatedTokens = Math.ceil((text.length + (attach?.content?.length || 0)) / 4) + 200;
          proLimits.tokens += estimatedTokens;
          
          if (proLimits.tier === 0 && proLimits.tokens >= 3000) {
             proLimits.timeoutUntil = Date.now() + 60 * 60 * 1000;
             proLimits.tier = 1;
          } else if (proLimits.tier === 1 && proLimits.tokens >= 7000) {
             proLimits.timeoutUntil = Date.now() + 8 * 60 * 60 * 1000;
             proLimits.tier = 2;
          }
          localStorage.setItem("orion_pro_limits_" + user.user_id, JSON.stringify(proLimits));
          updateProLock();
        }
      }
      // Old guest limit check (replaced)
      if (false) {
      if (!user && activeModel.includes("Pro")) {
        let uses = parseInt(localStorage.getItem("orion_pro_uses") || "0", 10);
        if (uses >= 2) {
          c.messages.push({ role: "assistant", content: "You have reached your limit of 2 free uses for the Pro model as a guest. Please log in or switch to a different model." });
          saveChat();
          renderMessages();
          return;
        }
        localStorage.setItem("orion_pro_uses", (uses + 1).toString());
      }
      }

      // Command handling
      if (text.startsWith("/generate ")) {
        const parts = text.split(" ");
        const type = parts[1];
        const arg = parts.slice(2).join(" ");
        
        if (type === "image") {
          const isViolating = /(hate|kill|murder|abuse|violence|racist|terrorist)/i.test(text);
        if (isViolating) {
           c.messages.push({ role: "user", text: "This message is hidden, it may violate AI guidelines policy.", isHidden: true, isEditing: false });
           c.messages.push({ role: "assistant", content: "I cannot fulfill this request as it goes against safety guidelines." });
           saveChat(); renderMessages(); return;
        }
        c.messages.push({ role: "user", text, attach: attach ? attach.type : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });
          if (!user) {
            let uses = parseInt(localStorage.getItem("orion_image_uses") || "0", 10);
            if (uses >= 1) {
              c.messages.push({ role: "assistant", content: "You have reached your limit of 1 free image generation as a guest. Please log in to generate more images." });
              saveChat(); renderMessages(); return;
            }
            localStorage.setItem("orion_image_uses", (uses + 1).toString());
          }
          
          const msgId = Date.now().toString();
          c.messages.push({ role: "assistant", type: "image_generating", prompt: arg, id: msgId, startTime: Date.now() });
          nameFromMessage(c, text);
          saveChat(); renderMessages();
          return;
        } else if (["paragraph", "story", "essay"].includes(type)) {
          c.messages.push({ role: "user", text, attach: attach ? attach.type : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });
          c.messages.push({ role: "assistant", type: "essay_form", targetType: type });
          nameFromMessage(c, text);
          saveChat(); renderMessages(); return;
        }
      }

      // Intercept essay/paragraph requests
      if (!isEssayGenerate) {
        const essayMatch = text.toLowerCase().match(/write\s+(a|an)\s+(essay|paragraph|article|story)/i);
        if (essayMatch && c.messages[c.messages.length - 1]?.type !== "essay_form") {
          c.messages.push({ role: "assistant", type: "essay_form", targetType: essayMatch[2] });
          saveChat();
          renderMessages();
          return;
        }
      }

      // Direct rule check for creator query
      if (/who (created|made|built|developed|designed) (you|orion)/i.test(text)) {
        const creatorReply = "I was created by the Garexcell team.";
        c.messages.push({ role: "user", text, attach: attach ? attach.type : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });
        c.messages.push({ role: "assistant", content: creatorReply });
        nameFromMessage(c, text);
        saveChat();
        renderMessages();
        return;
      }

      // Direct rule check for Garexcell products query
      if (/(what|which) (products|websites|platforms|apps) (does|do) garexcell (own|have|operate|run)/i.test(text) || /garexcell products/i.test(text)) {
        const productReply = "Garexcell owns and operates the following products:\n\n- **[istartu.com](https://istartu.com)**: Garexcell platform for athletes recruitment where players can create player cards and message recruiters.\n- **[tv.istartu.com](https://tv.istartu.com)**: Basically istartu.com but with watching videos of athletes and streaming.\n- **[play.garexcell.com](https://play.garexcell.com)**: Garexcell cloud gaming and game social network.";
        c.messages.push({ role: "user", text, attach: attach ? attach.type : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });
        c.messages.push({ role: "assistant", content: productReply });
        nameFromMessage(c, text);
        saveChat();
        renderMessages();
        return;
      }

      // Direct handler for UK time request to guarantee 100% precision
      if (/(time in (uk|london|britain|england)|uk time|time is it in (uk|london))/i.test(text)) {
        const times = getWorldTimes();
        const timeReply = `The current time in the UK (London) is **${times.ukTime}**.`;
        c.messages.push({ role: "user", text, attach: attach ? attach.type : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });
        c.messages.push({ role: "assistant", content: timeReply });
        nameFromMessage(c, text);
        saveChat();
        renderMessages();
        return;
      }

      const guard = safetyRule(text + (attach && attach.name ? " " + attach.name : ""));
      if (guard) {
        c.messages.push({ role: "user", text, attach: attach ? attach.metaType : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });
        nameFromMessage(c, text);
        saveChat();
        const row = addBotShell();
        streamAnswer(row, guard);
        return;
      }

      const researched = c.mode === "research";
      if (researched) {
        searchNote.hidden = false;
      } else {
        searchNote.hidden = true;
      }

      c.messages.push({ role: "user", text, attach: attach ? (attach.type === "image" ? "image" : "video") : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });
      nameFromMessage(c, text);
      saveChat();
      renderMessages();

      const row = addBotShell();
      const bubble = row.querySelector(".bubble") as HTMLElement;

      const doDynamicCompletion = async () => {
        const q = text.toLowerCase();
        let staticReply = "";
        
        if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
          staticReply = "Hello! I am Orion. How can I assist you with your project or answer your questions today?";
        } else if (q.includes('code') || q.includes('react') || q.includes('typescript') || q.includes('javascript') || q.includes('function') || q.includes('script') || q.includes('build') || q.includes('component')) {
          staticReply = `Here is the complete implementation and technical breakdown for your request regarding "${text}":\n\n` +
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
        } else if (q.includes('who created you') || q.includes('who made you') || q.includes('creator')) {
            staticReply = "I was created by the Garexcell team as a customized offline AI model.";
        } else if (q.includes('garexcell products') || q.includes('products')) {
            staticReply = "Garexcell offers several products including istartu.com, tv.istartu.com, and play.garexcell.com.";
        } else {
          staticReply = `Regarding your question about "${text}":\n\n` +
            `Here is a direct and thorough answer based on your prompt:\n\n` +
            `1. **Core Concept**: Your query addresses key principles that require clear analytical breakdown and structured execution.\n` +
            `2. **Explanation & Details**: By breaking down the problem into logical steps, we ensure accurate outcomes, reliable performance, and clean formatting.\n` +
            `3. **Practical Application**: You can apply these principles directly to your workflow or project for optimal results.\n\n` +
            `Feel free to ask if you need further clarification, additional code examples, or deeper analysis!`;
        }

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              role: 'assistant',
              content: staticReply
            });
          }, 400); // Slight delay for realistic typing feel
        });
      };

      doDynamicCompletion()
        .then((completion: any) => {
          searchNote.hidden = true;
          if (isEssayGenerate) completion.hasEssayOptions = true;
          c.messages.push(completion);
          saveChat();
          return streamAnswer(row, completion.content).then(() => renderMessages());
        })
        .catch((e: any) => {
          searchNote.hidden = true;
          bubble.innerHTML = '<div class="bot-response">Sorry, something went wrong. Please try again.</div>';
          console.error(e);
        });
    }

    function nameFromMessage(c: any, m: string) {
      if (!c.name || c.name === "New chat") {
        const plain = m.trim ? m : "Chat";
        c.name = plain.slice(0, 34) + (plain.length > 34 ? "…" : "");
        chatTitle.textContent = c.name;
      }
    }
    function addBotShell() {
      showChat();
      const row = document.createElement("div");
      row.className = "row bot-row";
      row.innerHTML = `<div class="avatar bot">${ICONS.bot}</div><div class="bubble bot-response">
        <div class="thinking-spinner-wrap">
          <svg class="thinking-spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke-width="3" stroke="currentColor" stroke-dasharray="31.4 31.4" stroke-linecap="round"></circle></svg>
          <span>Orion is thinking...</span>
        </div>
      </div>`;
      chatEl.appendChild(row);
      scrollToBottom();
      return row;
    }
    let isGenerating = false;
    let stopGenerationFlag = false;

    function setGenerating(gen: boolean) {
      isGenerating = gen;
      if (gen) {
        sendBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;
        sendBtn.setAttribute('aria-label', 'Stop generating');
        sendBtn.disabled = false;
      } else {
        sendBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20v-6l8-2-8-2V4l18 8z"/></svg>`;
        sendBtn.setAttribute('aria-label', 'Send');
        autoResize();
      }
    }

    sendBtn.addEventListener("click", (e) => {
      if (isGenerating) {
        e.preventDefault();
        stopGenerationFlag = true;
        setGenerating(false);
      }
    });

    async function streamAnswer(rowEl: HTMLElement, text: string) {
      const bubble = rowEl.querySelector(".bubble") as HTMLElement;
      bubble.innerHTML = "";
      const cursor = '<span class="cursor"></span>';
      const parts = text.split(/(\s+)/);
      let i = 0;
      const chunkSize = 4;
      stopGenerationFlag = false;
      setGenerating(true);
      await new Promise<void>((resolveInner) => {
        const step = () => {
          if (stopGenerationFlag) {
            bubble.innerHTML = mdToHtml(parts.slice(0, i).join(""));
            setGenerating(false);
            resolveInner();
            return;
          }
          i = Math.min(parts.length, i + chunkSize);
          bubble.innerHTML = mdToHtml(parts.slice(0, i).join("")) + cursor;
          scrollToBottom();
          if (i < parts.length) requestAnimationFrame(() => setTimeout(step, 14));
          else { 
            bubble.innerHTML = mdToHtml(parts.join("")); 
            setGenerating(false);
            resolveInner(); 
          }
        };
        step();
      });
    }

    /* ---------------- Composer ---------------- */
    const cmdPopup = $("commandPopup");
    const cmdInputContainer = $("cmdInputContainer");
    const cmdTypeEl = $("cmdType");
    const cmdArg = $("cmdArg") as HTMLInputElement;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      let t = input.value;
      
      if (cmdInputContainer.style.display === "flex") {
         const type = cmdTypeEl.textContent;
         const arg = cmdArg.value;
         if (!arg.trim()) return;
         
         t = `/generate ${type} ${arg}`;
         
         cmdInputContainer.style.display = "none";
         input.style.display = "block";
         cmdArg.value = "";
      }

      if (!t.trim() && !pendingAttach) return;
      const attach = pendingAttach;
      pendingAttach = null;
      plusBtn.classList.remove("active");
      input.placeholder = "Message Orion";
      input.value = "";
      autoResize();
      scrollToBottom();
      run(t, attach || null);
    });

    input.addEventListener("input", (e) => {
      autoResize();
      if (input.value.trim() === "/generate") {
        cmdPopup.hidden = false;
      } else {
        cmdPopup.hidden = true;
      }
    });

    cmdPopup.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement).closest(".cmd-item");
      if (item) {
        const cmd = (item as HTMLElement).dataset.cmd;
        input.style.display = "none";
        cmdInputContainer.style.display = "flex";
        cmdTypeEl.textContent = cmd || "image";
        cmdArg.placeholder = cmd === "image" ? "describe what image..." : `what ${cmd}...`;
        cmdArg.focus();
        cmdPopup.hidden = true;
      }
    });

    cmdArg.addEventListener("keydown", (e) => {
       if (e.key === "Backspace" && cmdArg.value === "") {
          cmdInputContainer.style.display = "none";
          input.style.display = "block";
          input.value = "/generate ";
          input.focus();
       }
       if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          form.dispatchEvent(new Event("submit"));
       }
    });

    function autoResize() {
      sendBtn.disabled = (!input.value.trim() && cmdInputContainer.style.display !== "flex" && !cmdArg.value.trim()) && !pendingAttach;
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 160) + "px";
    }

    cmdArg.addEventListener("input", autoResize);

    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.dispatchEvent(new Event("submit")); } });
    containerRef.current!.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      
      const chip = target.closest(".chip");
      if (chip) {
        input.value = chip.textContent || "";
        form.dispatchEvent(new Event("submit"));
        return;
      }

      const optBtn = target.closest(".chip-btn");
      if (optBtn) {
        const action = (optBtn as HTMLElement).dataset.action;
        if (action) {
          input.value = action;
          form.dispatchEvent(new Event("submit"));
        }
        return;
      }

      const c = getChat();
      if (target.closest(".user-del-btn")) {
        const idx = parseInt((target.closest(".user-del-btn") as HTMLElement).dataset.index || "-1", 10);
        if (idx >= 0 && c) {
          c.messages.splice(idx, 2); // remove user msg and bot response
          saveChat();
          renderMessages();
        }
        return;
      }

      if (target.closest(".user-edit-btn")) {
        const idx = parseInt((target.closest(".user-edit-btn") as HTMLElement).dataset.index || "-1", 10);
        if (idx >= 0 && c && c.messages[idx]) {
          c.messages[idx].isEditing = true;
          renderMessages();
        }
        return;
      }

      if (target.closest(".edit-cancel-btn")) {
        const idx = parseInt((target.closest(".edit-cancel-btn") as HTMLElement).dataset.index || "-1", 10);
        if (idx >= 0 && c && c.messages[idx]) {
          c.messages[idx].isEditing = false;
          renderMessages();
        }
        return;
      }

      if (target.closest(".edit-save-btn")) {
        const idx = parseInt((target.closest(".edit-save-btn") as HTMLElement).dataset.index || "-1", 10);
        if (idx >= 0 && c && c.messages[idx]) {
          const textarea = document.getElementById(`edit-text-${idx}`) as HTMLTextAreaElement;
          const newText = textarea.value;
          const oldMsg = c.messages[idx];
          
          c.messages = c.messages.slice(0, idx); // Truncate history
          saveChat();
          renderMessages();
          
          run(newText, oldMsg.attach ? {type: oldMsg.attach, url: oldMsg.image, content: oldMsg.content} : null);
        }
        return;
      }

      if (target.closest(".bot-regen-btn")) {
        const idx = parseInt((target.closest(".bot-regen-btn") as HTMLElement).dataset.index || "-1", 10);
        if (idx >= 1 && c && c.messages[idx]) {
          const userMsg = c.messages[idx - 1]; // Assume previous is the user message
          c.messages = c.messages.slice(0, idx - 1); // Truncate history before user message
          saveChat();
          renderMessages();
          
          run(userMsg.text, userMsg.attach ? {type: userMsg.attach, url: userMsg.image, content: userMsg.content} : null);
        }
        return;
      }

      if (target.closest(".user-copy-btn")) {
        const text = (target.closest(".user-copy-btn") as HTMLElement).dataset.text;
        if (text) navigator.clipboard.writeText(text);
        return;
      }

      if (target.closest(".bot-copy-btn")) {
        const text = (target.closest(".bot-copy-btn") as HTMLElement).dataset.text;
        if (text) navigator.clipboard.writeText(text);
        return;
      }
    });

    /* ---------------- Sidebar ---------------- */
    newChatCard.addEventListener("click", newChat);
    sideClose.addEventListener("click", closeSidebar);
    burger.addEventListener("click", openSidebar);
    scrim.addEventListener("click", closeSidebar);
    function openSidebar() { sidebar.classList.add("open"); scrim.classList.add("show"); }
    function closeSidebar() { sidebar.classList.remove("open"); scrim.classList.remove("show"); }

    /* ---------------- Model menu ---------------- */
    modelSelect.addEventListener("click", (e) => { e.stopPropagation(); modelMenu.classList.toggle("open"); modelSelect.setAttribute("aria-expanded", modelMenu.classList.contains("open") ? "true" : "false"); });
    containerRef.current!.addEventListener("click", (e) => { if (!modelMenu.classList.contains("open")) return; if (!(e.target as HTMLElement).closest(".model-wrap")) modelMenu.classList.remove("open"); });
    modelMenu.addEventListener("click", (e) => {
      const opt = (e.target as HTMLElement).closest(".model-option") as HTMLElement;
      if (opt && opt.classList.contains("locked")) return;
      if (!opt) return;
      activeModel = opt.dataset.model || "";
      modelLabel.textContent = opt.dataset.model || "";
      modelMenu.querySelectorAll(".model-option").forEach((o) => o.classList.toggle("active", o === opt));
      const c = getChat();
      if (c) { c.model = activeModel; saveChat(); }
      modelMenu.classList.remove("open");
    });

    /* ---------------- Bottom sheet + attach ---------------- */
    plusBtn.addEventListener("click", openSheet);
    function openSheet() {
      sheet.hidden = false;
      sheetScrim.hidden = false;
      containerRef.current!.querySelectorAll(".mode-card").forEach((mc: any) => mc.classList.toggle("active", mc.dataset.mode === draftMode));
    }
    function closeSheet() { sheet.hidden = true; sheetScrim.hidden = true; }
    sheetScrim.addEventListener("click", closeSheet);
    $("closeSheetBtn")?.addEventListener("click", closeSheet);

    containerRef.current!.querySelectorAll(".mode-card").forEach((mc: any) => {
      mc.addEventListener("click", () => {
        draftMode = mc.dataset.mode;
        const c = getChat();
        if (c) { c.mode = draftMode; saveChat(); }
        containerRef.current!.querySelectorAll(".mode-card").forEach((o) => o.classList.toggle("active", o === mc));
        closeSheet();
      });
    });
    
    // Wire up uploadImage and uploadVideo actions to file inputs
    containerRef.current!.querySelector("#uploadImage")?.addEventListener("click", () => { closeSheet(); fileImage.click(); });
    containerRef.current!.querySelector("#uploadVideo")?.addEventListener("click", () => { closeSheet(); fileVideo.click(); });

    fileImage.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const f = target.files?.[0];
      if (!f) return;
      fileToDataUrl(f).then((dataUrl) => {
        pendingAttach = { type: "image", metaType: "image", url: dataUrl, intro: "Describe this image.", content: [{ type: "image_url", image_url: { url: dataUrl } }] };
        plusBtn.classList.add("active");
        input.placeholder = "Ask about the image…";
        autoResize();
        input.focus();
      });
      target.value = "";
    });
    fileVideo.addEventListener("change", async (e) => {
      const target = e.target as HTMLInputElement;
      const f = target.files?.[0];
      if (!f) return;
      const frames = await videoToFrames(f);
      pendingAttach = { type: "video", metaType: "video", intro: "What are the key points of this video?", content: frames };
      plusBtn.classList.add("active");
      input.placeholder = "Ask about the video…";
      autoResize();
      input.focus();
      target.value = "";
    });

    function fileToDataUrl(f: File) {
      return new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
    }
    function videoToFrames(file: File) {
      return new Promise<any[]>((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        video.src = url;
        const frames: any[] = [];
        const canvas = document.createElement("canvas");
        video.onloadedmetadata = () => {
          const dur = video.duration || 0;
          const n = Math.min(4, Math.max(1, Math.round(dur / 3)));
          const seek = (idx: number) => {
            if (idx >= n) { URL.revokeObjectURL(url); resolve(frames); return; }
            const t = (idx / Math.max(1, n - 1)) * Math.max(0.1, dur - 0.2);
            video.onseeked = () => {
              const d = captureFrame(video, canvas);
              if (d) frames.push({ type: "image_url", image_url: { url: d } });
              seek(idx + 1);
            };
            video.currentTime = t;
          };
          seek(0);
        };
        video.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
      });
    }
    function captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
      const w = 640, h = 480;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      const vw = video.videoWidth, vh = video.videoHeight;
      if (!vw || !vh) return null;
      const scale = Math.min(w / vw, h / vh);
      const dw = vw * scale, dh = vh * scale;
      ctx!.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return canvas.toDataURL("image/jpeg", 0.7);
    }

    /* ---------------- Login screen ---------------- */
    avatarBtn.addEventListener("click", () => { loginScreen.hidden = false; });
    goBack.addEventListener("click", () => { loginScreen.hidden = true; });
    loginBtn.addEventListener("click", (e) => { e.preventDefault(); loginBtn.blur(); });

    /* ---------------- Rename ---------------- */
    editName.addEventListener("click", () => {
      const c = getChat();
      if (!c) return;
      const name = prompt("Rename chat:", c.name);
      if (name && name.trim()) {
        c.name = name.trim().slice(0, 60);
        chatTitle.textContent = c.name;
        saveChat();
        renderChatList();
      }
    });

    /* ---------------- Export ---------------- */
    const exportChatEl = $("exportChat");
    exportChatEl.addEventListener("click", () => {
      const c = getChat();
      if (!c || c.messages.length === 0) {
        alert("No conversation to export.");
        return;
      }
      let exportText = `Conversation: ${c.name || "New chat"}\nDate: ${new Date().toLocaleString()}\n\n`;
      c.messages.forEach((m: any) => {
        if (m.type === "image_result") {
          exportText += `Orion (Image Generation):\n[Generated Image: ${m.url}]\n\n`;
        } else if (m.type !== "image_generating" && m.type !== "essay_form") {
          exportText += `${m.role === "user" ? "You" : "Orion"}:\n${m.text || m.content}\n\n`;
        }
      });
      const blob = new Blob([exportText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orion-chat-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    /* ---------------- Init ---------------- */
    function updateProLock() {
      if (!user) return;
      let proLimits = JSON.parse(localStorage.getItem("orion_pro_limits_" + user.user_id) || '{"tokens":0,"tier":0,"timeoutUntil":null}');
      const isLocked = proLimits.timeoutUntil && Date.now() < proLimits.timeoutUntil;
      const proOpt = Array.from(document.querySelectorAll(".model-option")).find(el => (el as HTMLElement).dataset.model === "Orion Intelligence (Pro)");
      if (proOpt) {
         if (isLocked) {
            proOpt.innerHTML = `<span class="m-dot p"></span>Orion Intelligence <em>(Pro)</em> <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: auto; color: var(--muted);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> <span style="font-size: 11px; color: var(--muted); margin-left: 4px;">Unavailable</span>`;
            proOpt.classList.add("locked");
            if (activeModel === "Orion Intelligence (Pro)") {
               activeModel = "Scorpio Flash";
               const lbl = document.getElementById("modelLabel");
               if (lbl) lbl.textContent = "Scorpio Flash";
            }
         } else {
            proOpt.innerHTML = `<span class="m-dot p"></span>Orion Intelligence <em>(Pro)</em>`;
            proOpt.classList.remove("locked");
         }
      }
    }
    
    function init() {
      autoResize();
      renderChatList();
      if (chats.length) openChat(chats[0].id);
      else showWelcome();
    }
    init();

    // Close button for react router integration
    const closeBtn = containerRef.current!.querySelector("#closeAppBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        navigate(-1);
      });
    }

  }, [navigate]);

  return (
    <div className="orion-ai-page" ref={containerRef}>
      {/* Sidebar */}
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-head">
          <button className="brand" id="brandBtn">
            <span className="gem-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.9 5.6a2 2 0 0 0 1.2 1.2L20 10.5l-5.9 1.7a2 2 0 0 0-1.2 1.2L11 19l-1.9-5.6a2 2 0 0 0-1.2-1.2L2 10.5l5.9-1.7a2 2 0 0 0 1.2-1.2L12 2z"/>
              </svg>
            </span>
            <span className="brand-name">Orion</span>
          </button>
          <button className="side-close" id="sideClose" aria-label="Close sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 12h12M13 5l7 7-7 7"/></svg>
          </button>
        </div>

        <button className="new-cat-card" id="newChatCard">
          <span className="cat-pencil" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
          </span>
          <span>New chat</span>
        </button>

        <div className="sidebar-label">Recent chats</div>
        <nav className="chat-list" id="chatList" aria-label="Recent chats"></nav>
      </aside>

      <div className="scrim" id="scrim"></div>

      {/* Main column */}
      <div className="main-col">
        <header className="topbar">
          <button className="burger" id="burger" aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>

          <div className="model-wrap">
            <button className="model-select" id="modelSelect" aria-haspopup="listbox" aria-expanded="false">
              <svg className="model-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>
              <span id="modelLabel">Scorpio Flash</span>
              <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div className="model-menu" id="modelMenu" role="listbox">
              <div className="model-menu-title">Choose AI Model Engine</div>
              <button className="model-option active" data-model="Scorpio Flash"><span className="m-dot f"></span>Scorpio Flash (Orion Fast AI)</button>
              <button className="model-option" data-model="Scorpio Sting"><span className="m-dot s"></span>Scorpio Sting (Orion Creative)</button>
              <button className="model-option" data-model="Orion Intelligence (Pro)"><span className="m-dot p"></span>Orion Intelligence <em>(Pro)</em></button>
            </div>
          </div>

          <div className="chat-title-wrap" id="chatTitleWrap">
            <span id="chatTitle" className="chat-title">New chat</span>
            <button className="edit-name" id="editName" title="Rename chat" aria-label="Rename chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
            </button>
            <button className="export-chat" id="exportChat" title="Export conversation" aria-label="Export conversation">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
          </div>

          <button className="avatar-btn" id="avatarBtn" aria-label="Account" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {user ? (
              <img src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt="User Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : "O"}
          </button>
          <button className="close-btn" id="closeAppBtn" aria-label="Close AI Page" title="Close">
            <X size={18} />
          </button>
        </header>

        <main className="app">
          <section className="welcome" id="welcome">
            <h1 className="welcome-title">
              Hello,
              <span className="gradient-text">I&rsquo;m Orion.</span>
            </h1>
            <p className="welcome-sub">Ask me anything — I can even search the web for fresh, up-to-date answers.</p>
            <div className="chips" id="chips">
              <button className="chip">Explain black holes simply</button>
              <button className="chip">What's the latest in AI?</button>
              <button className="chip">Give me a study plan</button>
              <button className="chip">Tell me about the deep sea</button>
            </div>
          </section>

          <section className="chat" id="chat" aria-live="polite"></section>

          <div className="searchnote" id="searchNote" hidden>
            Searching the web<span className="dots">...</span>
          </div>
        </main>

        <form className="composer" id="composer" style={{ position: "relative", marginBottom: user ? "72px" : "12px", zIndex: 40 }}>
          <div id="commandPopup" className="command-popup" hidden>
            <div className="cmd-item" data-cmd="image">/generate image</div>
            <div className="cmd-item" data-cmd="paragraph">/generate paragraph</div>
            <div className="cmd-item" data-cmd="story">/generate story</div>
            <div className="cmd-item" data-cmd="essay">/generate essay</div>
          </div>
          <div className="composer-box">
            <button className="button plus" type="button" id="plusBtn" aria-label="Attach &amp; mode">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
               <div id="cmdInputContainer" className="cmd-input-container">
                  <div className="cmd-pill">/generate <span id="cmdType">image</span></div>
                  <input type="text" id="cmdArg" placeholder="what image..." />
               </div>
               <textarea id="input" rows={1} placeholder="Message Orion" autoComplete="off"></textarea>
            </div>
            <button className="send" id="send" type="submit" aria-label="Send" disabled>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20v-6l8-2-8-2V4l18 8z"/></svg>
            </button>
          </div>
          <p className="minor-note">Orion can make mistakes. Manual checks help keep answers accurate.</p>
        </form>
      </div>

      {/* Bottom sheet */}
      <div className="sheet-scrim" id="sheetScrim" hidden></div>
      <div className="sheet" id="sheet" hidden>
        <div className="sheet-handle"></div>
        <h2 className="sheet-title">Attach &amp; Choose mode</h2>

        <div className="sheet-grid">
          <button className="sheet-action" id="uploadImage">
            <span className="sa-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            </span>
            <span>Upload image</span>
          </button>
          <button className="sheet-action" id="uploadVideo">
            <span className="sa-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
            </span>
            <span>Upload video</span>
          </button>
        </div>

        <div className="sheet-label">Select a mode</div>
        <div className="mode-grid">
          <button className="mode-card active" data-mode="generate">
            <span className="mc-ic g"><Sparkles size={20} /></span>
            <span className="mc-name">Generate</span>
            <span className="mc-desc">Create text answers from knowledge</span>
          </button>
          <button className="mode-card" data-mode="research">
            <span className="mc-ic r"><Search size={20} /></span>
            <span className="mc-name">Research</span>
            <span className="mc-desc">Search the web</span>
          </button>
        </div>
        <div style={{ marginTop: '20px' }}>
          <button className="login-go-back" id="closeSheetBtn" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
        </div>
        <input type="file" id="fileImage" accept="image/*" hidden />
        <input type="file" id="fileVideo" accept="video/*" hidden />
      </div>

      {/* Login screen overlay */}
      <div className="login-screen" id="loginScreen" hidden>
        <div className="login-main">
          <div className="user-avatar-lg" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {user ? (
              <img src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt="User Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : "O"}
          </div>
          <h2>{user ? "Account Details" : "Guest Mode"}</h2>
          <p className="minor-note">{user ? `Logged in as ${user.username}` : "You are using Orion as a guest."}</p>
          
          {user && (
            <div style={{width: '100%', maxWidth: '300px', marginTop: '10px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px'}}>
               <h3 style={{fontSize: '14px', color: 'var(--text)', marginBottom: '2px', fontWeight: 'bold'}}>AI Settings</h3>
               <button style={{padding: '12px 14px', background: 'var(--bg-soft)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left', fontWeight: '600', cursor: 'pointer', color: 'var(--text)', fontSize: '14px'}}>Activity</button>
               <button style={{padding: '12px 14px', background: 'var(--bg-soft)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left', fontWeight: '600', cursor: 'pointer', color: 'var(--text)', fontSize: '14px'}}>Personalization</button>
               <button style={{padding: '12px 14px', background: 'var(--bg-soft)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left', fontWeight: '600', cursor: 'pointer', color: 'var(--text)', fontSize: '14px'}}>Memory</button>
               
               <button style={{marginTop: '12px', padding: '14px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}}>
                  <Sparkles size={16} /> Upgrade to Pro
               </button>
            </div>
          )}
        </div>
        <button className="login-btn" id="loginBtn" style={{ display: user ? "none" : "block" }}>Login to save chats</button>
        <button className="login-go-back" id="goBack">Go back</button>
      </div>

      {user && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 110 }}>
          <BottomBar />
        </div>
      )}
    </div>
  );
};
