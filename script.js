(() => {
  "use strict";

  // ============================================================
  // PHASE 0 — fx namespace (shared utilities)
  // ============================================================
  const motionMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const touchMQ = matchMedia("(hover: none), (pointer: coarse)");

  const fx = {
    reduced: motionMQ.matches,
    touch: touchMQ.matches,
    scrambleChars:
      "アイウエオカキクケコサシスセソタチツテトナニヌネノﾊﾋﾌﾍﾎ0123456789ABCDEF<>{}[]()=+-*&^%$#@!?/",
    enabled() {
      return !document.body.classList.contains("no-effects") && !fx.reduced;
    },
    rand(a, b) {
      return a + Math.random() * (b - a);
    },
    pick(s) {
      return s[Math.floor(Math.random() * s.length)];
    },
  };
  motionMQ.addEventListener("change", (e) => {
    fx.reduced = e.matches;
  });

  function sizeCanvasFor(c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    c.style.width = window.innerWidth + "px";
    c.style.height = window.innerHeight + "px";
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  // ============================================================
  // Year
  // ============================================================
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ============================================================
  // Matrix rain
  // ============================================================
  const canvas = document.getElementById("matrix-rain");
  const ctx = canvas && canvas.getContext("2d");
  let rainRAF = null;
  let drops = [];

  function sizeCanvas() {
    if (!canvas) return;
    sizeCanvasFor(canvas);
    const cols = Math.floor(window.innerWidth / 16);
    drops = new Array(cols).fill(0).map(() => Math.random() * -50);
  }

  function drawRain() {
    if (!ctx) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, w, h);

    const themeAmber = document.documentElement.dataset.theme === "amber";
    const head = themeAmber ? "#ffe7b0" : "#b8ffc8";
    const trail = themeAmber ? "#ffb000" : "#00ff41";

    ctx.font = '15px "VT323", monospace';
    for (let i = 0; i < drops.length; i++) {
      const ch = fx.pick(fx.scrambleChars);
      const x = i * 16;
      const y = drops[i] * 18;

      ctx.fillStyle = head;
      ctx.fillText(ch, x, y);
      ctx.fillStyle = trail;
      ctx.fillText(ch, x, y - 18);

      if (y > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    rainRAF = requestAnimationFrame(drawRain);
  }

  function startRain() {
    if (!canvas) return;
    sizeCanvas();
    cancelAnimationFrame(rainRAF);
    drawRain();
  }
  function stopRain() {
    cancelAnimationFrame(rainRAF);
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener("resize", () => {
    if (!document.body.classList.contains("no-effects")) startRain();
  });

  if (!fx.reduced) {
    startRain();
  } else {
    canvas && canvas.remove();
  }

  // ============================================================
  // Boot sequence
  // ============================================================
  const bootEl = document.getElementById("boot");

  const DOB = new Date("2001-08-07");
  function ageVersion(dob) {
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (now.getDate() < dob.getDate()) months--;
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years}.${String(months).padStart(2, "0")}`;
  }
  const KERNEL_VERSION = ageVersion(DOB);

  const bootLines = [
    ["[  OK  ] ", `Loaded kernel sarfaraz-${KERNEL_VERSION}-matrix.`, "ok"],
    ["[ INFO ] ", 'Welcome. Type "help" for commands.', "ok"],
  ];

  function typeBoot(i) {
    if (!bootEl || i >= bootLines.length) {
      document.dispatchEvent(new CustomEvent("boot:done"));
      return;
    }
    const [tag, msg, cls] = bootLines[i];
    const line = document.createElement("div");
    line.className = "boot-line";
    line.innerHTML = `<span class="${cls}">${tag}</span>${msg}`;
    bootEl.appendChild(line);
    setTimeout(() => typeBoot(i + 1), 140 + Math.random() * 120);
  }
  typeBoot(0);

  // ============================================================
  // PHASE 1 — Auth gate (auto cinematic: connect → decrypt → reveal)
  // ============================================================
  const gateEl = document.getElementById("auth-gate");
  const termContent = document.getElementById("term-content");
  let gatePhase = "idle"; // idle | connecting | decrypting | done
  let gateAbort = false;

  function revealContent() {
    if (!termContent) return;
    if (gateEl) {
      gateEl.classList.add("auth-gate-out");
      setTimeout(() => {
        gateEl.setAttribute("hidden", "");
      }, 350);
    }
    termContent.classList.remove("gate-hidden");
    termContent.classList.add("gate-revealed");
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("content:revealed"));
    }, 650);
    gatePhase = "done";
    document.removeEventListener("keydown", gateSkip, true);
  }

  function appendLine(parent, text, cls) {
    const line = document.createElement("div");
    line.className = "auth-line" + (cls ? " " + cls : "");
    line.innerHTML = text;
    parent.appendChild(line);
    return line;
  }

  async function runConnectLog() {
    const log = document.getElementById("auth-conn-log");
    if (!log) return;
    const lines = [
      [120, "[net] resolving sarfaraz.matrix.local ...", ""],
      [320, "[net] route established &middot; 198.51.100.42", "ok"],
      [240, "[tls] handshake initiated", ""],
      [300, "[tls] cipher: ECDHE-RSA-AES256-GCM", "ok"],
      [220, "[auth] attempting access ...", "auth-loading"],
    ];
    for (const [delay, msg, cls] of lines) {
      if (gateAbort) return;
      await sleep(delay);
      if (gateAbort) return;
      appendLine(log, msg, cls);
    }
    await sleep(450);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function runDecrypt() {
    if (gatePhase === "decrypting" || gatePhase === "done") return;
    gatePhase = "decrypting";
    const progressEl = gateEl.querySelector(".auth-progress");
    if (progressEl) progressEl.removeAttribute("hidden");

    const bar = gateEl.querySelector(".auth-bar-fill");
    const pct = gateEl.querySelector(".auth-pct");
    const status = gateEl.querySelector(".auth-status");

    const steps = [
      [0.3, "&gt; HANDSHAKE OK", "ok"],
      [0.65, "&gt; KEY EXCHANGE OK", "ok"],
      [1.0, "&gt; ACCESS GRANTED", "ok"],
    ];
    let stepIdx = 0;
    const dur = 1300;
    const start = performance.now();

    await new Promise((resolve) => {
      function frame(t) {
        if (gateAbort) return resolve();
        const p = Math.min(1, (t - start) / dur);
        if (bar) bar.style.width = (p * 100).toFixed(1) + "%";
        if (pct) pct.textContent = Math.floor(p * 100) + "%";
        while (stepIdx < steps.length && p >= steps[stepIdx][0]) {
          const [, msg, cls] = steps[stepIdx];
          appendLine(status, msg, cls);
          stepIdx++;
        }
        if (p < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
    await sleep(450);
  }

  async function runGate() {
    gatePhase = "connecting";
    document.addEventListener("keydown", gateSkip, true);
    await runConnectLog();
    if (gateAbort) return;
    await runDecrypt();
    if (gateAbort) return;
    revealContent();
  }

  function gateSkip(e) {
    if (e.key !== "Escape") return;
    if (gatePhase === "done") return;
    e.preventDefault();
    gateAbort = true;
    document.removeEventListener("keydown", gateSkip, true);
    revealContent();
  }

  document.addEventListener("boot:done", () => {
    if (!gateEl || !termContent) {
      document.dispatchEvent(new CustomEvent("content:revealed"));
      return;
    }
    if (fx.reduced || document.body.classList.contains("no-effects")) {
      revealContent();
      return;
    }
    gateEl.removeAttribute("hidden");
    runGate();
  });

  // ============================================================
  // Phosphor color toggle (green <-> amber)
  // ============================================================
  const themeBtn = document.getElementById("theme-toggle");
  const stored = localStorage.getItem("phosphor");
  if (stored === "amber") document.documentElement.dataset.theme = "amber";

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme;
      if (cur === "amber") {
        delete document.documentElement.dataset.theme;
        localStorage.setItem("phosphor", "green");
      } else {
        document.documentElement.dataset.theme = "amber";
        localStorage.setItem("phosphor", "amber");
      }
      document.dispatchEvent(new CustomEvent("theme:change"));
    });
  }

  // ============================================================
  // Effects toggle
  // ============================================================
  const fxBtn = document.getElementById("effects-toggle");
  const fxStored = localStorage.getItem("fx");
  if (fxStored === "off") {
    document.body.classList.add("no-effects");
    stopRain();
  }
  if (fxBtn) {
    fxBtn.addEventListener("click", () => {
      const off = document.body.classList.toggle("no-effects");
      localStorage.setItem("fx", off ? "off" : "on");
      if (off) stopRain();
      else startRain();
      document.dispatchEvent(
        new CustomEvent("fx:toggle", { detail: { off } }),
      );
    });
  }

  // ============================================================
  // PHASE 2 — Decrypt scramble reveals
  // ============================================================
  const SCRAMBLE_SEL = [
    ".entry-title",
    ".entry-meta",
    ".entry-list li",
    ".skill-group-title",
    ".skill-group li",
    ".kv-grid .v",
    ".prompt-cmd",
  ].join(",");
  const activeScrambles = new Set();
  let scrambleRAF = null;
  let scrambleObserver = null;

  function scrambleTick(now) {
    if (activeScrambles.size === 0) {
      scrambleRAF = null;
      return;
    }
    for (const s of activeScrambles) {
      const p = Math.min(1, (now - s.start) / s.dur);
      const revealed = Math.floor(p * s.target.length);
      let out = "";
      for (let i = 0; i < s.target.length; i++) {
        const ch = s.target[i];
        if (i < revealed || ch === " " || ch === "\n") out += ch;
        else out += fx.pick(fx.scrambleChars);
      }
      s.node.textContent = out;
      if (p >= 1) {
        s.node.textContent = s.target;
        s.node.classList.remove("scrambling");
        activeScrambles.delete(s);
      }
    }
    scrambleRAF = requestAnimationFrame(scrambleTick);
  }

  function startScramble(node) {
    const target = node._scrambleTarget;
    if (!target) return;
    node.classList.remove("scramble-pending");
    node.classList.add("scrambling");
    const dur = Math.max(400, Math.min(900, target.length * 28));
    activeScrambles.add({
      node,
      target,
      start: performance.now(),
      dur,
    });
    if (!scrambleRAF) scrambleRAF = requestAnimationFrame(scrambleTick);
  }

  function finishAllScrambles() {
    for (const s of activeScrambles) {
      s.node.textContent = s.target;
      s.node.classList.remove("scrambling");
    }
    activeScrambles.clear();
    cancelAnimationFrame(scrambleRAF);
    scrambleRAF = null;
    document.querySelectorAll(".scramble-pending").forEach((n) => {
      if (n._scrambleTarget) n.textContent = n._scrambleTarget;
      n.classList.remove("scramble-pending");
    });
  }

  document.addEventListener("content:revealed", () => {
    if (!termContent) return;
    const nodes = termContent.querySelectorAll(SCRAMBLE_SEL);
    nodes.forEach((n) => {
      n._scrambleTarget = n.textContent;
    });

    if (fx.reduced || !fx.enabled()) {
      return;
    }

    nodes.forEach((n) => n.classList.add("scramble-pending"));

    scrambleObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            scrambleObserver.unobserve(e.target);
            startScramble(e.target);
          }
        }
      },
      { rootMargin: "-5% 0px", threshold: 0.1 },
    );
    nodes.forEach((n) => scrambleObserver.observe(n));
  });

  document.addEventListener("fx:toggle", (e) => {
    if (e.detail && e.detail.off) finishAllScrambles();
  });

  // ============================================================
  // PHASE 3 — Heading glitch (random timer)
  // ============================================================
  let glitchTimer = null;
  function scheduleGlitch() {
    if (!fx.enabled()) return;
    const targets = document.querySelectorAll(
      ".prompt-cmd, .entry-title, .skill-group-title",
    );
    if (!targets.length) return;
    const lo = fx.touch ? 16000 : 8000;
    const hi = fx.touch ? 30000 : 15000;
    glitchTimer = setTimeout(() => {
      if (fx.enabled()) {
        const t = targets[Math.floor(Math.random() * targets.length)];
        t.classList.add("glitch");
        setTimeout(() => t.classList.remove("glitch"), 380);
      }
      scheduleGlitch();
    }, fx.rand(lo, hi));
  }

  document.addEventListener("content:revealed", scheduleGlitch);
  document.addEventListener("fx:toggle", (e) => {
    clearTimeout(glitchTimer);
    glitchTimer = null;
    if (e.detail && !e.detail.off) scheduleGlitch();
  });

  // ============================================================
  // PHASE 4 — Click flash + ripple
  // ============================================================
  const ripplesEl = document.getElementById("click-ripples");
  let lastClick = 0;
  let aliveRipples = 0;

  document.addEventListener("pointerdown", (e) => {
    if (!fx.enabled()) return;
    if (!ripplesEl) return;
    const tgt = e.target;
    if (tgt.closest && (tgt.closest("#term-input") || tgt.closest(".term-controls") || tgt.closest("#auth-gate")))
      return;
    if (tgt.id === "term-input") return;
    const now = performance.now();
    if (now - lastClick < 80) return;
    lastClick = now;
    if (aliveRipples >= 6) return;

    document.body.classList.add("flash");
    setTimeout(() => document.body.classList.remove("flash"), 130);

    const r = document.createElement("span");
    r.className = "ripple";
    r.style.left = e.clientX + "px";
    r.style.top = e.clientY + "px";
    ripplesEl.appendChild(r);
    aliveRipples++;
    r.addEventListener("animationend", () => {
      r.remove();
      aliveRipples--;
    });
  });

  // ============================================================
  // PHASE 5 — Glitch bar sweep
  // ============================================================
  const barEl = document.getElementById("glitch-bar");
  let barTimer = null;
  function scheduleBar() {
    if (!barEl || !fx.enabled()) return;
    const lo = fx.touch ? 20000 : 10000;
    const hi = fx.touch ? 40000 : 20000;
    barTimer = setTimeout(() => {
      if (fx.enabled()) {
        barEl.classList.add("sweep");
        setTimeout(() => barEl.classList.remove("sweep"), 240);
      }
      scheduleBar();
    }, fx.rand(lo, hi));
  }

  document.addEventListener("content:revealed", scheduleBar);
  document.addEventListener("fx:toggle", (e) => {
    clearTimeout(barTimer);
    barTimer = null;
    if (e.detail && !e.detail.off) scheduleBar();
  });

  // ============================================================
  // PHASE 6 — Cursor phosphor trail
  // ============================================================
  const trailCanvas = document.getElementById("cursor-trail");
  if (trailCanvas && !fx.touch && !fx.reduced) {
    const tctx = sizeCanvasFor(trailCanvas);
    const TRAIL_LEN = 12;
    const points = [];
    let trailRAF = null;
    let lastMove = performance.now();
    let trailColor = "#00ff41";

    function readPhosphor() {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--green")
        .trim();
      if (v) trailColor = v;
    }
    readPhosphor();
    document.addEventListener("theme:change", readPhosphor);

    window.addEventListener("resize", () => sizeCanvasFor(trailCanvas));

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      points.push({ x: e.clientX, y: e.clientY });
      if (points.length > TRAIL_LEN) points.shift();
      lastMove = performance.now();
      if (!trailRAF) trailRAF = requestAnimationFrame(drawTrail);
    });

    function drawTrail(now) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      tctx.globalCompositeOperation = "destination-out";
      tctx.fillStyle = "rgba(0,0,0,0.35)";
      tctx.fillRect(0, 0, w, h);
      tctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const age = (i + 1) / points.length;
        const r = 1 + age * 2;
        tctx.fillStyle = trailColor;
        if (i === points.length - 1) {
          tctx.shadowColor = trailColor;
          tctx.shadowBlur = 8;
        } else {
          tctx.shadowBlur = 0;
        }
        tctx.beginPath();
        tctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        tctx.fill();
      }
      tctx.globalCompositeOperation = "source-over";
      tctx.shadowBlur = 0;

      if (now - lastMove > 600 && points.length) {
        points.shift();
      }
      if (points.length === 0 && now - lastMove > 2000) {
        tctx.clearRect(0, 0, w, h);
        trailRAF = null;
        return;
      }
      trailRAF = requestAnimationFrame(drawTrail);
    }

    document.addEventListener("fx:toggle", (e) => {
      if (e.detail && e.detail.off) {
        cancelAnimationFrame(trailRAF);
        trailRAF = null;
        points.length = 0;
        tctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      }
    });
  } else if (trailCanvas) {
    trailCanvas.style.display = "none";
  }

  // ============================================================
  // Copy email
  // ============================================================
  const emailLink = document.getElementById("email-copy");
  const toast = document.getElementById("copy-toast");

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("visible"), 2200);
  }

  if (emailLink) {
    emailLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = emailLink.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        showToast(`> ${email} copied`);
      } catch {
        window.location.href = `mailto:${email}`;
      }
    });
  }

  // ============================================================
  // Interactive prompt
  // ============================================================
  const input = document.getElementById("term-input");
  const history = document.getElementById("term-history");
  const cmdHist = [];
  let histIdx = -1;

  const COMMANDS = {
    help: () =>
      `available commands:
  help        show this list
  whoami      who I am
  summary     short intro
  experience  work history
  education   degree info
  skills      tech I work with
  projects    things I'm building
  contact     reach me
  resume      open resume.pdf
  clear       clear history
  date        current date/time
  echo <txt>  print text
  sudo        try it
  matrix      toggle rain effects
  phosphor    toggle green/amber`,
    whoami: () =>
      `Sk Sarfaraz Ahamed — Senior Software Engineer / Full Stack
 Mumbai · 4+ yrs · open to senior IC / staff roles`,
    summary: () =>
      `Senior Software Engineer with 4+ years building full-stack apps.
I write clean React/Next.js UIs on the front, and reliable APIs
in NestJS, Node.js, and Python (FastAPI, Django) on the back.
I ship microservices on AWS/GCP and plug in LLM features when
they help.`,
    skills: () =>
      `front-end  : JavaScript, TypeScript, React.js, Next.js, Redux,
             HTML5, CSS3, Electron, jQuery, Design Systems
back-end   : Python (FastAPI, Django, Flask, Selenium),
             Node.js, NestJS, REST APIs
ai         : LLMs (ChatGPT, Claude), Copilot, RAG,
             Vector Databases, Model Fine-Tuning
cloud      : AWS (EC2, S3, Lambda, SQS, API Gateway),
             GCP, Docker, Linux, GitHub CI/CD`,
    experience: () =>
      `SDE-II  @ Data Sutram  Mar 2025 – Present  · Mumbai
SDE-I   @ Data Sutram  Jul 2022 – Feb 2025 · Mumbai
Intern  @ Data Sutram  Dec 2021 – Jun 2022 · Mumbai
Intern  @ Mirror Score Aug 2020 – Jan 2022 · Delhi`,
    education: () =>
      `Bachelor of Computer Application
Techno International New Town · Kolkata
Jul 2019 – Jun 2022`,
    projects: () =>
      `1. MeetRead AI            — Meeting intelligence on your own infra.
                            Records audio, captures transcripts,
                            writes summaries. Data stays with you.
2. AI Engineering Ecosystems — Small apps built on RAG + Vector DBs
                            to read messy multimedia metadata.`,
    contact: () =>
      `email    : sksarfaraz4006@gmail.com
github   : github.com/ssadev
linkedin : linkedin.com/in/sk-sarfaraz`,
    resume: () => {
      window.open(
        "https://drive.google.com/file/d/1Bw5EFS6mRTc6BnSuMBZCVl9vILIDGIYv/view?usp=sharing",
        "_blank",
      );
      return "opening resume...";
    },
    date: () => new Date().toString(),
    sudo: () =>
      `sarfaraz is not in the sudoers file. This incident will be reported.`,
    matrix: () => {
      fxBtn && fxBtn.click();
      return "effects toggled.";
    },
    phosphor: () => {
      themeBtn && themeBtn.click();
      return "phosphor color toggled.";
    },
    clear: () => {
      history.innerHTML = "";
      history.classList.add("hidden");
      return null;
    },
    ls: () =>
      `about.md  skills/  experience/  projects/  resume.pdf  contact.sh`,
    pwd: () => "/home/sarfaraz",
    uname: () => `sarfaraz-${KERNEL_VERSION}-matrix x86_64`,
  };

  function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const [cmd, ...rest] = trimmed.split(/\s+/);
    const args = rest.join(" ");

    const promptHtml = `<span style="color:var(--green)">sarfaraz</span><span style="color:var(--green-dim)">@</span><span style="color:var(--cyan)">matrix</span><span style="color:var(--green-dim)">:</span><span style="color:var(--amber)">~</span><span style="color:var(--green)">$</span> <span style="color:var(--green-pale);font-weight:bold">${escapeHtml(trimmed)}</span>`;

    let out;
    if (cmd === "echo") {
      out = args;
    } else if (COMMANDS[cmd]) {
      out = COMMANDS[cmd]();
    } else {
      out = `<span class="err">zsh: command not found: ${escapeHtml(cmd)}</span>\ntry: help`;
    }

    if (cmd === "clear") {
      history.innerHTML = "";
      history.classList.add("hidden");
      return;
    }

    history.classList.remove("hidden");
    const block = document.createElement("div");
    block.innerHTML =
      `<div style="margin-top:10px">${promptHtml}</div>` +
      (out == null
        ? ""
        : `<pre style="margin:4px 0 0;padding:4px 0 4px 14px;border-left:2px solid var(--green-dark);white-space:pre-wrap;color:var(--green-pale)">${out}</pre>`);
    history.appendChild(block);
    history.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const v = input.value;
        if (v.trim()) {
          cmdHist.push(v);
          histIdx = cmdHist.length;
        }
        runCommand(v);
        input.value = "";
      } else if (e.key === "ArrowUp") {
        if (histIdx > 0) {
          histIdx--;
          input.value = cmdHist[histIdx] || "";
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (histIdx < cmdHist.length - 1) {
          histIdx++;
          input.value = cmdHist[histIdx] || "";
        } else {
          histIdx = cmdHist.length;
          input.value = "";
        }
        e.preventDefault();
      } else if (e.key === "Tab") {
        e.preventDefault();
        const prefix = input.value.trim();
        const match = Object.keys(COMMANDS).find((k) => k.startsWith(prefix));
        if (match) input.value = match;
      }
    });
  }

  // ============================================================
  // Konami: glitch
  // ============================================================
  const konami = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  let kIdx = 0;
  document.addEventListener("keydown", (e) => {
    if (e.key === konami[kIdx]) {
      kIdx++;
      if (kIdx === konami.length) {
        document.body.style.transition = "filter 0.4s ease";
        document.body.style.filter = "hue-rotate(120deg) saturate(2)";
        showToast("// glitch in the matrix");
        setTimeout(() => {
          document.body.style.filter = "";
        }, 2500);
        kIdx = 0;
      }
    } else {
      kIdx = 0;
    }
  });
})();
