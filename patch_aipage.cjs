const fs = require('fs');
let code = fs.readFileSync('src/pages/AIPage.tsx', 'utf8');

// 1. Add Pro limit logic for free users
code = code.replace(
  '// Pro usage limit check for guests',
  `// Pro usage limit check
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
      if (false) {`
);

code = code.replace(
  'localStorage.setItem("orion_pro_uses", (uses + 1).toString());\n      }',
  'localStorage.setItem("orion_pro_uses", (uses + 1).toString());\n      }\n      }'
);

// 2. Add AI guidelines filter
code = code.replace(
  'c.messages.push({ role: "user", text, attach: attach ? attach.type : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });',
  `const isViolating = /(hate|kill|murder|abuse|violence|racist|terrorist)/i.test(text);
        if (isViolating) {
           c.messages.push({ role: "user", text: "This message is hidden, it may violate AI guidelines policy.", isHidden: true, isEditing: false });
           c.messages.push({ role: "assistant", content: "I cannot fulfill this request as it goes against safety guidelines." });
           saveChat(); renderMessages(); return;
        }
        c.messages.push({ role: "user", text, attach: attach ? attach.type : null, image: attach && attach.type === "image" ? attach.url : null, content: attach ? attach.content : null });`
);

// 3. Render red text if isHidden
code = code.replace(
  '<span>${escapeHtml(m.text || "")}</span>',
  `\${m.isHidden ? '<span style="color: #ef4444; font-weight: 500;">' + escapeHtml(m.text || "") + '</span>' : '<span>' + escapeHtml(m.text || "") + '</span>'}`
);

// 4. Implement updateProLock
code = code.replace(
  'function init() {',
  `function updateProLock() {
      if (!user) return;
      let proLimits = JSON.parse(localStorage.getItem("orion_pro_limits_" + user.user_id) || '{"tokens":0,"tier":0,"timeoutUntil":null}');
      const isLocked = proLimits.timeoutUntil && Date.now() < proLimits.timeoutUntil;
      const proOpt = Array.from(document.querySelectorAll(".model-option")).find(el => (el as HTMLElement).dataset.model === "Orion Intelligence (Pro)");
      if (proOpt) {
         if (isLocked) {
            proOpt.innerHTML = \\\`<span class="m-dot p"></span>Orion Intelligence <em>(Pro)</em> <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: auto; color: var(--muted);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> <span style="font-size: 11px; color: var(--muted); margin-left: 4px;">Unavailable</span>\\\`;
            proOpt.classList.add("locked");
            if (activeModel === "Orion Intelligence (Pro)") {
               activeModel = "Scorpio Flash";
               const lbl = document.getElementById("modelLabel");
               if (lbl) lbl.textContent = "Scorpio Flash";
            }
         } else {
            proOpt.innerHTML = \\\`<span class="m-dot p"></span>Orion Intelligence <em>(Pro)</em>\\\`;
            proOpt.classList.remove("locked");
         }
      }
    }
    
    function init() {`
);

// 5. Add updateProLock to init
code = code.replace(
  'renderMessages();',
  'updateProLock(); renderMessages();'
);

// 6. Handle locked click
code = code.replace(
  'const opt = (e.target as HTMLElement).closest(".model-option") as HTMLElement;',
  `const opt = (e.target as HTMLElement).closest(".model-option") as HTMLElement;
      if (opt && opt.classList.contains("locked")) return;`
);

// 7. Add padding to bottom on mobile when logged in
code = code.replace(
  'className="main"',
  'className="main" style={user ? { paddingBottom: "70px" } : {}}'
);

fs.writeFileSync('src/pages/AIPage.tsx', code);
