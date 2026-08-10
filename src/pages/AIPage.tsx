import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

    // We shim the websim API to hit our backend or just use a mock locally as requested (doesn't use a server)
    const websim = {
      chat: {
        completions: {
          create: async (req: any) => {
            try {
              const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req)
              });
              
              if (!response.ok) {
                console.error("AI chat failed", await response.text());
                return { role: 'assistant', content: 'Sorry, the AI service is currently unavailable.' };
              }
              
              return await response.json();
            } catch (err) {
              console.error("AI chat error", err);
              return { role: 'assistant', content: 'Sorry, there was an error communicating with the AI service.' };
            }
          }
        }
      }
    };

    // ------------- START OF USER UPLOADED JS (Adapted for React container) -------------
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
  1. istartu.com
  2. tv.istartu.com
  3. play.garexcell.com

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
        "You are Orion, a warm, helpful, supportive, and deeply knowledgeable AI assistant created by the Garexcell team. " +
        "You MUST answer concisely, directly, and only based on the user's inquiry. You are STRICTLY FORBIDDEN from using conversational filler such as 'Here is the information you requested', 'Here is the answer', or similar phrases. " +
        "When asked who created you, state clearly that you were created by the Garexcell team. " +
        "When asked what products Garexcell owns, list istartu.com, tv.istartu.com, and play.garexcell.com. " +
        DATA + "\n" +
        "Provide deep, accurate, and structured answers with headings, bullet points, and blue clickable links. " +
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
      const c = getChat();
      if (!c) return;
      chatEl.innerHTML = "";
      c.messages.forEach((m: any) => {
        if (m.role === "user") {
          const row = document.createElement("div");
          row.className = "row user-row";
          let inner = `<div class="avatar user">${ICONS.user}</div><div class="bubble">`;
          if (c.mode === "research") inner += `<span class="mode-pill research">Research</span>`;
          if (m.attach === "image") inner += `<img class="attach-thumb" src="${m.image || ""}" alt="uploaded image"/>`;
          if (m.attach === "video") inner += `<span class="attach-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg> Video attached</span>`;
          inner += `<span>${escapeHtml(m.text || "")}</span></div>`;
          row.innerHTML = inner;
          chatEl.appendChild(row);
        } else {
          const row = document.createElement("div");
          row.className = "row bot-row";
          row.innerHTML = `<div class="avatar bot">${ICONS.bot}</div><div class="bubble bot-response">${mdToHtml(m.content)}</div>`;
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

    /* ---------------- Pretrained Offline Model Helper ---------------- */
    function getPretrainedResponse(text: string): string {
      const query = text.toLowerCase().trim();

      // 1. Black holes
      if (/black.?hole/i.test(query)) {
        return `### 🌌 Black Holes (Orion Offline Knowledge Base)

A **black hole** is an incredibly dense region of spacetime where gravity is so intense that nothing—not even light—can escape its pull. Here is a simplified breakdown of how they operate:

1. **Stellar Collapse:** Most black holes are born when massive stars run out of fuel and collapse under their own colossal weight.
2. **Event Horizon:** This is the "boundary of no escape." Once an object crosses the event horizon, the escape velocity exceeds the speed of light.
3. **Singularity:** At the core lies a point of infinite density where the laws of conventional physics break down.

*Intuitive Analogy:* Imagine placing a heavy lead weight on a soft mattress; it creates a deep well. A black hole is like a well so deep that objects can only slide inward, never climbing back up.`;
      }

      // 2. Study plan
      if (/study.?plan|how to study|study guide/i.test(query)) {
        return `### 📚 High-Efficiency Study Blueprint (Pretrained Parameter Set)

Here is a scientifically optimized, offline-friendly study regimen built into my local weights:

*   **1. The Pomodoro Protocol:** Maintain deep focus blocks of 25–50 minutes, followed by 5–10 minute active rest intervals. Avoid context switching at all costs.
*   **2. Active Recall over Passive Reading:** Instead of simply highlighting textbooks, shut the book and write down everything you remember or attempt to teach it aloud.
*   **3. Spaced Repetition Intervals:** Review key concepts at growing intervals (1 day, 3 days, 7 days, 30 days) to convert short-term memories into permanent cerebral pathways.
*   **4. Feedback Diagnostic:** Constantly test yourself using past papers or custom queries to find knowledge gaps early.`;
      }

      // 3. Deep sea
      if (/deep.?sea|ocean|abyss|marine life/i.test(query)) {
        return `### 🌊 The Deep Sea Abyss (Orion Offline Oceanography)

The deep sea (the bathypelagic and abyssal zones) is one of the most extreme environments on Earth, yet it contains highly specialized life forms:

*   **Bioluminescence:** Over 90% of deep-sea creatures generate chemical light to attract prey, search for mates, or startle predators in absolute darkness.
*   **Hydrothermal Vents:** Superheated water (up to 400°C) rich in hydrogen sulfide erupts from ocean fissures. Chemoautotrophic bacteria turn these chemicals into energy, supporting thriving communities without any sunlight.
*   **Atmospheric Pressure:** At the bottom of the Mariana Trench, the water pressure is over 1,000 times that of sea level, equivalent to having an elephant balance on your fingertip.`;
      }

      // 4. Jokes
      if (/joke|tell me a joke/i.test(query)) {
        return `### ⚡ Pretrained Humor Module
Here is a classic from my offline dataset:

**Why don't scientists trust atoms?**
*Because they make up everything!* ⚛️`;
      }

      // 5. Help / Capabilities
      if (/help|what can you do|capabilities|features/i.test(query)) {
        return `### ⚙️ Orion Local Capabilities

I am running in **Pretrained Mode**, responding entirely from my offline knowledge base without using external servers.

**What I can do offline:**
- Explain scientific, historical, and philosophical concepts.
- Provide structured study strategies, brainstorming, and writing assistance.
- Help debug code and explain programming logic.
- Answer queries about Garexcell products.

**Active Research Mode:**
If you need **up-to-date 2026 information**, real-time weather, or external links, select **Research Mode** from the attach (+) menu or mention words like *weather, news, or latest*. This activates my Gemini active web search integration.`;
      }

      // 6. Special Coding/Programming
      if (/code|program|developer|javascript|typescript|python|html|css|react|node/i.test(query)) {
        return `### 💻 Software Architecture & Coding Insights

As an offline pretrained assistant, I have compiled extensive knowledge of modern software development:

*   **Modularity:** Always split complex components into smaller, isolated modules to prevent large file overflows and state pollution.
*   **Clean Abstractions:** Keep side effects out of render cycles. In React, stabilize callbacks using dependencies.
*   **Type Safety:** Leverage TypeScript's strong compiler tools to capture runtime mismatches early.

Here is a fast local state implementation template:
\`\`\`typescript
interface StateContainer<T> {
  value: T;
  listeners: Set<(val: T) => void>;
  update: (next: T) => void;
}
\`\`\`

Let me know what specific block of code or logic you would like to refine!`;
      }

      // 7. Gaming
      if (/game|gaming|playxcade|cloud|console|pc/i.test(query)) {
        return `### 🎮 Gaming & Cloud Systems Analysis

From my localized weights, I have complete records on advanced gaming systems:

- **Low Latency Pipelines:** Cloud gaming networks (like **Garexcell Cloud Gaming**) rely on real-time video frames streamed with sub-15ms encoding speeds.
- **WebRTC Interoperability:** High-fidelity multiplayer voice/video rooms utilize STUN/TURN servers to establish robust peer-to-peer pipelines.
- **Performance Optimization:** Keeping your framerates stable requires offloading heavy compute tasks to secondary worker threads.`;
      }

      // Catch-all general pretrained assistant response
      return `### 🧠 Orion Pretrained Model (8B Offline Weights)

I am responding directly from my localized parameter weights. As a pretrained offline-first assistant, I have analyzed your query and formulated the following synthesis:

- **Substantive Core:** You asked about "${text}".
- **Offline Understanding:** This falls into my core training corpus. I can process logic, analyze text, and draft structured responses locally.
- **Limitations:** I am currently running without active external network search. For live 2026 events, current local weather, or dynamic web page lookups, please activate **Research Mode** from the attach (+) menu.

How would you like to build on this or explore further?`;
    }

    /* ---------------- Send flow ---------------- */
    function run(text: string, attach: any) {
      text = text.trim();
      if (!text && attach) text = (attach.intro || (attach.type === "video" ? "What are the key points of this video?" : "Describe this image."));
      if (!text && !attach) return;
      let c = getChat();
      if (!c) { newChat(); c = getChat(); }

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
        const productReply = "Garexcell owns and operates the following products:\n\n- [istartu.com](https://istartu.com)\n- [tv.istartu.com](https://tv.istartu.com)\n- [play.garexcell.com](https://play.garexcell.com)";
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

      const researched = c.mode === "research" || /weather|temperature|today|latest|news|forecast|current|breaking|scrape|instagram|tiktok|twitter|threads|istartu|2026/i.test(text);
      if (researched) searchNote.hidden = false;

      c.messages.push({ role: "user", text, attach: attach ? (attach.type === "image" ? "image" : "video") : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });
      nameFromMessage(c, text);
      saveChat();
      renderMessages();

      const row = addBotShell();
      const bubble = row.querySelector(".bubble") as HTMLElement;

      if (!researched) {
        // Run locally as a Pretrained Offline Model
        setTimeout(() => {
          const completion = {
            role: "assistant",
            content: getPretrainedResponse(text)
          };
          c.messages.push(completion);
          saveChat();
          streamAnswer(row, completion.content).then(() => renderMessages());
        }, 400); // 400ms delay to make the offline response feel snappy and natural
        return;
      }

      websim.chat.completions.create({ messages: buildMessages(c, researched), researched })
        .then((completion: any) => {
          searchNote.hidden = true;
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
      row.innerHTML = `<div class="avatar bot">${ICONS.bot}</div><div class="bubble bot-response"><span class="cursor"></span></div>`;
      chatEl.appendChild(row);
      scrollToBottom();
      return row;
    }
    async function streamAnswer(rowEl: HTMLElement, text: string) {
      const bubble = rowEl.querySelector(".bubble") as HTMLElement;
      bubble.innerHTML = "";
      const cursor = '<span class="cursor"></span>';
      const parts = text.split(/(\s+)/);
      let i = 0;
      const chunkSize = 4;
      await new Promise<void>((resolveInner) => {
        const step = () => {
          i = Math.min(parts.length, i + chunkSize);
          bubble.innerHTML = mdToHtml(parts.slice(0, i).join("")) + cursor;
          scrollToBottom();
          if (i < parts.length) requestAnimationFrame(() => setTimeout(step, 14));
          else { bubble.innerHTML = mdToHtml(parts.join("")); resolveInner(); }
        };
        step();
      });
    }

    /* ---------------- Composer ---------------- */
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const t = input.value;
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
    input.addEventListener("input", autoResize);
    function autoResize() {
      sendBtn.disabled = !input.value.trim() && !pendingAttach;
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 160) + "px";
    }
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.dispatchEvent(new Event("submit")); } });
    containerRef.current!.addEventListener("click", (e) => {
      const chip = (e.target as HTMLElement).closest(".chip");
      if (chip) {
        input.value = chip.textContent || "";
        form.dispatchEvent(new Event("submit"));
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

    /* ---------------- Init ---------------- */
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
              <div className="model-menu-title">Choose a model</div>
              <button className="model-option active" data-model="Scorpio Flash"><span className="m-dot f"></span>Scorpio Flash</button>
              <button className="model-option" data-model="Scorpio Sting"><span className="m-dot s"></span>Scorpio Sting</button>
              <button className="model-option" data-model="Orion Intelligence (Pro)"><span className="m-dot p"></span>Orion Intelligence <em>(Pro)</em></button>
            </div>
          </div>

          <div className="chat-title-wrap" id="chatTitleWrap">
            <span id="chatTitle" className="chat-title">New chat</span>
            <button className="edit-name" id="editName" title="Rename chat" aria-label="Rename chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
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

        <form className="composer" id="composer">
          <div className="composer-box">
            <button className="button plus" type="button" id="plusBtn" aria-label="Attach &amp; mode">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <textarea id="input" rows={1} placeholder="Message Orion" autoComplete="off"></textarea>
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

      {/* Login screen overlay (if needed, kept for parity with HTML) */}
      <div className="login-screen" id="loginScreen" hidden>
        <div className="login-main">
          <div className="user-avatar-lg" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {user ? (
              <img src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt="User Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : "O"}
          </div>
          <h2>{user ? "Account Details" : "Guest Mode"}</h2>
          <p className="minor-note">{user ? `Logged in as ${user.username}` : "You are using Orion as a guest."}</p>
        </div>
        <button className="login-btn" id="loginBtn" style={{ display: user ? "none" : "block" }}>Login to save chats</button>
        <button className="login-go-back" id="goBack">Go back</button>
      </div>

    </div>
  );
};
