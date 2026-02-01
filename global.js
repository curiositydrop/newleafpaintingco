// global.js  ✅ (inject header + footer + contact popup reliably)

(async function () {
  // Add a loading class so we can hide the global containers until injected
  document.documentElement.classList.add("global-loading");

  const cacheBust = Date.now(); // helps Safari cache issues while you're iterating
  const res = await fetch(`global.html?v=${cacheBust}`, { cache: "no-store" });
  const html = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const mountHeader = document.getElementById("global-header");
  const mountFooter = document.getElementById("global-footer");

  if (!mountHeader || !mountFooter) {
    console.warn("Missing #global-header or #global-footer on this page.");
    document.documentElement.classList.remove("global-loading");
    document.documentElement.classList.add("global-ready");
    return;
  }

  // Grab pieces from global.html
  const headerEl = doc.querySelector("header");
  const footerEl = doc.querySelector("footer");

  const contactBtn = doc.querySelector("#contact-btn");
  const contactPopup = doc.querySelector("#contact-popup");

  // Inject header + footer
  mountHeader.innerHTML = headerEl ? headerEl.outerHTML : "";
  mountFooter.innerHTML = footerEl ? footerEl.outerHTML : "";

  // Ensure only ONE contact button/popup exist on the page
  document.getElementById("contact-btn")?.remove();
  document.getElementById("contact-popup")?.remove();

  // Append contact UI to end of body (works regardless of where footer loads)
  if (contactBtn) document.body.appendChild(contactBtn);
  if (contactPopup) document.body.appendChild(contactPopup);

  // ===== Wire up contact popup open/close =====
  const popup = document.getElementById("contact-popup");
  const btn = document.getElementById("contact-btn");

  const openPopup = (e) => {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    if (!popup) return;
    popup.style.display = "flex";
  };

  const closePopup = () => {
    if (!popup) return;
    popup.style.display = "none";
  };

  // Floating button opens popup
  if (btn) btn.onclick = openPopup;

  // Any element with data-contact-open="1" opens popup
  document.querySelectorAll('[data-contact-open="1"]').forEach((el) => {
    el.onclick = openPopup;
  });

  // Close button + click outside
  if (popup) {
    const closeBtn = popup.querySelector(".close");
    if (closeBtn) closeBtn.onclick = closePopup;

    popup.onclick = (e) => {
      if (e.target === popup) closePopup();
    };

    // Esc closes
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePopup();
    });
  }

  // Mark as ready (stops the flash)
  document.documentElement.classList.remove("global-loading");
  document.documentElement.classList.add("global-ready");
})();
