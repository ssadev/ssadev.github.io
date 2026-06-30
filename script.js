(() => {
  "use strict";

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
  const GLYPHS =
    "アイウエオカキクケコサシスセソタチツテトナニヌネノﾊﾋﾌﾍﾎ0123456789ABCDEF<>$#@!*+/";

  function sizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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
      const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
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

  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    startRain();
  } else {
    canvas && canvas.remove();
  }

  // ============================================================
  // Boot sequence
  // ============================================================
  const bootEl = document.getElementById("boot");

  // DOB: YYYY-MM-DD. Kernel version derived as <years>.<months> since this date.
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
    if (!bootEl || i >= bootLines.length) return;
    const [tag, msg, cls] = bootLines[i];
    const line = document.createElement("div");
    line.className = "boot-line";
    line.innerHTML = `<span class="${cls}">${tag}</span>${msg}`;
    bootEl.appendChild(line);
    setTimeout(() => typeBoot(i + 1), 140 + Math.random() * 120);
  }
  typeBoot(0);

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
    });
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
Andheri, Mumbai · 4+ yrs · open to senior IC / staff roles`,
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
phone    : +91 8585879272
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
