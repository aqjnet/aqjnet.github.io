(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- statusbar year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- KPI count-up ---------- */
  const runCount = (el) => {
    const target = Number(el.dataset.count);
    if (reducedMotion) {
      el.textContent = target;
      return;
    }
    const duration = 900;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  let counted = false;
  const runCounts = () => {
    if (counted) return;
    counted = true;
    document.querySelectorAll("[data-count]").forEach(runCount);
  };

  /* ---------- console routing ---------- */
  const landing = document.getElementById("landing");
  const consoleStage = document.getElementById("console-stage");
  const MODULES = ["overview", "experience", "capabilities", "attestations", "contact"];

  const showModule = (id) => {
    document.querySelectorAll(".module").forEach((m) => {
      m.hidden = m.dataset.module !== id;
    });
    document.querySelectorAll(".side .item[data-module]").forEach((b) => {
      const active = b.dataset.module === id;
      b.classList.toggle("active", active);
      if (active) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (id === "overview") runCounts();
  };

  const applyRoute = () => {
    const match = location.hash.match(/^#\/(\w+)$/);
    const mod = match && MODULES.includes(match[1]) ? match[1] : null;
    const inConsole = Boolean(mod);
    landing.hidden = inConsole;
    consoleStage.hidden = !inConsole;
    document.body.classList.toggle("console-mode", inConsole);
    if (mod) showModule(mod);
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    // clear the hash without adding a history entry jump
    history.pushState(null, "", location.pathname + location.search);
    applyRoute();
  };

  window.addEventListener("hashchange", applyRoute);

  document.querySelectorAll(".side .item[data-module]").forEach((b) =>
    b.addEventListener("click", () => {
      location.hash = "/" + b.dataset.module;
    })
  );
  document.getElementById("btn-exit").addEventListener("click", goHome);
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      document.body.classList.contains("console-mode") &&
      !document.body.classList.contains("agent-mode")
    ) {
      goHome();
    }
  });

  /* ---------- human / agent view ---------- */
  const humanView = document.getElementById("human-view");
  const agentView = document.getElementById("agent-view");
  const segHuman = document.getElementById("seg-human");
  const segAgent = document.getElementById("seg-agent");
  const mdSource = document.getElementById("cv-md").textContent.trim();
  const mdPre = document.getElementById("agent-md");
  let mdStreamed = false;

  const streamMarkdown = () => {
    if (mdStreamed) return;
    mdStreamed = true;
    if (reducedMotion) {
      mdPre.textContent = mdSource;
      return;
    }
    const lines = mdSource.split("\n");
    let i = 0;
    const step = () => {
      i += 2;
      if (i < lines.length) {
        mdPre.textContent = lines.slice(0, i).join("\n") + "\n█";
        requestAnimationFrame(step);
      } else {
        mdPre.textContent = mdSource;
      }
    };
    requestAnimationFrame(step);
  };

  const setView = (mode) => {
    const agent = mode === "agent";
    humanView.hidden = agent;
    agentView.hidden = !agent;
    document.body.classList.toggle("agent-mode", agent);
    segHuman.classList.toggle("active", !agent);
    segAgent.classList.toggle("active", agent);
    segHuman.setAttribute("aria-pressed", String(!agent));
    segAgent.setAttribute("aria-pressed", String(agent));
    try { localStorage.setItem("cv-view", mode); } catch { /* private mode */ }
    if (agent) streamMarkdown();
  };

  segHuman.addEventListener("click", () => setView("human"));
  segAgent.addEventListener("click", () => setView("agent"));

  const savedView =
    new URLSearchParams(location.search).get("view") ||
    (() => { try { return localStorage.getItem("cv-view"); } catch { return null; } })();
  if (savedView === "agent") setView("agent");

  /* ---------- initial route ---------- */
  applyRoute();
})();
