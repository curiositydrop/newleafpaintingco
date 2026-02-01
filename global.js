// global.js
(() => {
  const GLOBAL_URL = "global.html"; // keep as-is

  // Add body class to reduce flash while injecting
  document.documentElement.classList.add("global-loading");

  function safeQS(sel, root = document) {
    try { return root.querySelector(sel); } catch { return null; }
  }
  function safeQSA(sel, root = document) {
    try { return Array.from(root.querySelectorAll(sel)); } catch { return []; }
  }

  function setActiveNav(root) {
    const path = (location.pathname.split("/").pop() || "").toLowerCase();
    if (!path) return;

    const links = safeQSA(".nav-links a", root);
    links.forEach(a => a.classList.remove("active"));

    // Match by href ending (past-projects.html etc.)
    const match = links.find(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      return href && href.split("?")[0] === path;
    });

    if (match) match.classList.add("active");

    // Special-case: if you're on "/" or index, highlight XP Home if you want:
    // if (path === "" || path === "index.html") safeQS("#homeLink", root)?.classList.add("active");
  }

  function wireContactPopup(root) {
    const popup = safeQS("#contact-popup", root);
    const floatBtn = safeQS("#contact-btn", root);
    const closeBtn = safeQS("#contact-popup .close", root);

    if (!popup) return;

    const open = (e) => {
      if (e) { e.preventDefault?.(); e.stopPropagation?.(); }
      popup.style.display = "flex";
      document.body.style.overflow = "hidden";
    };

    const close = (e) => {
      if (e) { e.preventDefault?.(); e.stopPropagation?.(); }
      popup.style.display = "none";
      document.body.style.overflow = "";
    };

    // Floating button
    if (floatBtn) floatBtn.addEventListener("click", open);

    // Any element with data-contact-open="1"
    safeQSA('[data-contact-open="1"]', root).forEach(el => {
      el.addEventListener("click", open);
    });

    // Close button
    if (closeBtn) closeBtn.addEventListener("click", close);

    // Click outside popup-content closes
    popup.addEventListener("click", (e) => {
      if (e.target === popup) close(e);
    });

    // ESC closes
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && popup.style.display === "flex") close(e);
    });

    // OPTIONAL: Hook up Send button if you want it to do something later.
    // const sendBtn = safeQS("#estimate-send", root);
    // if (sendBtn) sendBtn.addEventListener("click", () => { ... });
  }

  async function inject() {
    const headerMount = safeQS("#global-header");
    const footerMount = safeQS("#global-footer");

    // If mounts don't exist, bail quietly.
    if (!headerMount && !footerMount) {
      document.documentElement.classList.remove("global-loading");
      document.documentElement.classList.add("global-ready");
      return;
    }

    // Cache-bust in a way that won't wreck Netlify caching forever
    // (if you want even stronger busting, change v number manually when updating)
    const url = `${GLOBAL_URL}?v=3`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${GLOBAL_URL}: ${res.status}`);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const header = safeQS("header", doc);
    const footer = safeQS("footer", doc);

    if (headerMount) headerMount.innerHTML = header ? header.outerHTML : "";
    if (footerMount) footerMount.innerHTML = footer ? footer.outerHTML : "";

    // Now query inside the injected DOM (in the real page)
    const injectedRoot = document;

    setActiveNav(injectedRoot);
    wireContactPopup(injectedRoot);

    document.documentElement.classList.remove("global-loading");
    document.documentElement.classList.add("global-ready");
  }

  inject().catch(err => {
    console.error("Global inject error:", err);
    document.documentElement.classList.remove("global-loading");
    document.documentElement.classList.add("global-ready");
  });
})();
