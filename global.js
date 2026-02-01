// global.js
// Injects global.html header/footer and wires up nav active state + contact popup

(function () {
  const HEADER_MOUNT = document.getElementById("global-header");
  const FOOTER_MOUNT = document.getElementById("global-footer");

  // Nothing to mount into? Bail safely.
  if (!HEADER_MOUNT && !FOOTER_MOUNT) return;

  // During active editing, cache can make you think "nothing changed".
  // Leave cacheBust on for now; you can remove it later.
  const cacheBust = `v=${Date.now()}`;

  fetch(`global.html?${cacheBust}`, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load global.html");
      return r.text();
    })
    .then((html) => {
      const temp = document.createElement("div");
      temp.innerHTML = html;

      // Try to find header/footer inside global.html
      const headerEl = temp.querySelector("header");
      const footerEl = temp.querySelector("footer");

      if (HEADER_MOUNT && headerEl) HEADER_MOUNT.innerHTML = headerEl.outerHTML;
      if (FOOTER_MOUNT && footerEl) FOOTER_MOUNT.innerHTML = footerEl.outerHTML;

      // After injection, wire everything
      setActiveNavLink();
      wireContactPopup();
    })
    .catch((err) => {
      console.error(err);
    });

  function normalizePath(p) {
    // remove query/hash and trailing slashes
    return (p || "")
      .split("?")[0]
      .split("#")[0]
      .replace(/\/+$/, "");
  }

  function setActiveNavLink() {
    const current = normalizePath(window.location.pathname);
    const file = current.split("/").pop() || "";

    // Look for nav links in injected header
    const scope = document.getElementById("global-header") || document;
    const links = scope.querySelectorAll(".nav-links a");

    links.forEach((a) => a.classList.remove("active"));

    links.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const hrefFile = normalizePath(href).split("/").pop();

      // If href is "#" skip
      if (!hrefFile || hrefFile === "#") return;

      // Match by filename (past-projects.html etc.)
      if (hrefFile === file) {
        a.classList.add("active");
      }
    });

    // If you're on root "/", you might want to highlight XP Home (optional)
    if ((file === "" || file === "index.html") && links.length) {
      const xp = Array.from(links).find((a) => (a.getAttribute("href") || "").includes("xp-home.html"));
      if (xp) xp.classList.add("active");
    }
  }

  function wireContactPopup() {
    const scope = document; // popup lives in injected global.html, but easiest is document

    const popup = scope.querySelector("#contact-popup");
    const openBtn = scope.querySelector("#contact-btn");
    const closeBtn = scope.querySelector("#contact-popup .close");
    const sendBtn = scope.querySelector("#estimate-send");

    if (!popup) return;

    const openPopup = (e) => {
      if (e) {
        e.preventDefault?.();
        e.stopPropagation?.();
      }
      popup.style.display = "flex";
    };

    const closePopup = (e) => {
      if (e) {
        e.preventDefault?.();
        e.stopPropagation?.();
      }
      popup.style.display = "none";
    };

    // Floating button
    if (openBtn) openBtn.onclick = openPopup;

    // Any link/button with data-contact-open="1"
    scope.querySelectorAll('[data-contact-open="1"]').forEach((el) => {
      el.onclick = openPopup;
    });

    // Close X
    if (closeBtn) closeBtn.onclick = closePopup;

    // Click outside modal closes
    popup.addEventListener("click", (e) => {
      if (e.target === popup) closePopup(e);
    });

    // ESC closes
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && popup.style.display === "flex") closePopup(e);
    });

    // OPTIONAL: "Send" button -> mailto
    // If you already handle this elsewhere, remove this block.
    if (sendBtn) {
      sendBtn.onclick = () => {
        const name = (scope.querySelector("#name")?.value || "").trim();
        const email = (scope.querySelector("#email")?.value || "").trim();
        const phone = (scope.querySelector("#phone")?.value || "").trim();
        const msg = (scope.querySelector("#message")?.value || "").trim();

        const subject = encodeURIComponent("New Leaf Painting – Free Estimate Request");
        const body = encodeURIComponent(
          `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nProject Details:\n${msg}\n`
        );

        // CHANGE THIS if you want a different inbox
        const to = "newleafpaintingcompany@gmail.com";

        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      };
    }
  }
})();
