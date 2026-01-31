/* =========================================================
   NEW LEAF GLOBAL.JS (ONE SOURCE OF TRUTH)
   - Injects global.html into #global-header / #global-footer
   - Injects contact button + popup (once)
   - Forces nav links visible
   - Preserves nav=1, mode=hub|standard, and ref/drop/sample across links
   - Forces Home link to go back to correct index mode (no gate)
   - ✅ FIXES mailto in XP iframe by using window.top + fallback link
   ========================================================= */

(function () {

  /* --------------------
     HELPERS
  ---------------------*/
  function getMode() {
    const p = new URLSearchParams(window.location.search);
    const mode = (p.get("mode") || "standard").toLowerCase();
    return (mode === "hub" || mode === "standard") ? mode : "standard";
  }

  function getRefParam() {
    const p = new URLSearchParams(window.location.search);
    return p.get("ref") || p.get("drop") || p.get("sample") || "";
  }

  function isExternalHref(href) {
    if (!href) return true;
    return (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    );
  }

  function forceNavVisible() {
    document.querySelectorAll(".nav-links a").forEach(a => {
      a.style.visibility = "visible";
      a.style.opacity = "1";
      a.style.pointerEvents = "auto";
    });
  }

  function highlightActiveLink() {
    let currentPage = window.location.pathname.split("/").pop().toLowerCase();
    if (!currentPage) currentPage = "index.html";

    document.querySelectorAll("nav a").forEach(link => {
      let linkPage = (link.getAttribute("href") || "")
        .split("?")[0]
        .split("/")
        .pop()
        .toLowerCase();

      if (!linkPage) linkPage = "index.html";
      link.classList.toggle("active", linkPage === currentPage);
    });
  }

  function preserveParamsAcrossLinks() {
    const mode = getMode();
    const refParam = getRefParam();

    document.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#")) return;
      if (isExternalHref(href)) return;

      const url = new URL(href, window.location.origin);
      url.searchParams.set("nav", "1");
      url.searchParams.set("mode", mode);

      if (
        refParam &&
        !url.searchParams.has("ref") &&
        !url.searchParams.has("drop") &&
        !url.searchParams.has("sample")
      ) {
        url.searchParams.set("ref", refParam);
      }

      link.setAttribute("href", url.pathname.replace(/^\//, "") + url.search);
    });
  }

  function setupPopupHandlers() {
    const popup = document.getElementById("contact-popup");
    const btn = document.getElementById("contact-btn");
    const closeBtn = document.querySelector("#contact-popup .close");
    if (!popup || !btn || !closeBtn) return;

    btn.onclick = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      popup.style.display = "flex";
    };

    closeBtn.onclick = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      popup.style.display = "none";
    };

    window.addEventListener("click", e => {
      if (e.target === popup) popup.style.display = "none";
    });
  }

  function updatePopupHeadingAndButton(refData) {
    const btn = document.getElementById("contact-btn");
    if (btn && refData.buttontext) btn.textContent = refData.buttontext;

    const popupHeading = document.querySelector("#contact-popup h2");
    if (!popupHeading) return;

    const code = (refData.discountcode || "").toUpperCase();
    if (code.includes("DROP")) popupHeading.textContent = "Redeem Drop Reward";
    else if (code.includes("SAMPLE")) popupHeading.textContent = "Redeem Sample Reward";
    else popupHeading.textContent = "Get free estimate";
  }

  function setHiddenFieldsOnContactOpen(refData) {
    document.addEventListener("click", e => {
      if (e.target && e.target.id === "contact-btn") {
        const discountField = document.getElementById("discount-code");
        if (discountField) discountField.value = refData.discountcode || "";

        let refField = document.getElementById("referrer");
        if (!refField) {
          refField = document.createElement("input");
          refField.type = "hidden";
          refField.name = "referrer";
          refField.id = "referrer";
          document.querySelector("#contact-popup form")?.appendChild(refField);
        }

        if (refField) {
          refField.value =
            `${refData.referrername || ""}${refData.businessname ? " at " + refData.businessname : ""}`.trim();
        }
      }
    });
  }

  /* --------------------
     REFERRAL DATA (SHEET CSV)
  ---------------------*/
  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGQaoBZ7rMgXkLt9ZvLeF9zZ5V5qv1m4mlWWowx-VskRE6hrd1rHOVAg3M4JJfXCotw8wVVK_nVasH/pub?output=csv";

  const refData = {
    id: "",
    referrername: "",
    businessname: "",
    discountcode: "",
    bannertext: "",
    buttontext: "Get free estimate",
    emailsubject: "New Leaf Painting Inquiry",
    activeinactive: ""
  };

  function cleanValue(value) {
    return value ? value.replace(/^"|"$/g, "").trim() : "";
  }

  async function loadReferrerData() {
    const refParam = getRefParam();
    if (!refParam) return;

    try {
      const res = await fetch(sheetURL);
      const text = await res.text();
      const rows = text.trim().split("\n").map(r => r.split(","));
      const headers = rows.shift().map(h => h.trim().toLowerCase());

      const match = rows.find(row => (row[0] || "").trim().toLowerCase() === refParam.toLowerCase());
      if (!match) return;

      headers.forEach((h, i) => {
        refData[h] = cleanValue(match[i]);
      });
    } catch (err) {
      console.error("Error loading spreadsheet:", err);
    }
  }

  /* --------------------
     GLOBAL.HTML INJECTION
  ---------------------*/
  async function injectGlobalHTML() {
    const headerTarget = document.getElementById("global-header");
    const footerTarget = document.getElementById("global-footer");
    if (!headerTarget || !footerTarget) return;

    const hasHeader = !!headerTarget.querySelector("header");
    const hasFooter = !!footerTarget.querySelector("footer");
    const hasPopup = !!document.querySelector("#contact-popup");
    const hasBtn = !!document.querySelector("#contact-btn");

    if (hasHeader && hasFooter && hasPopup && hasBtn) return;

    const res = await fetch("global.html");
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const header = doc.querySelector("header");
    const footer = doc.querySelector("footer");
    const popup = doc.querySelector("#contact-popup");
    const btn = doc.querySelector("#contact-btn");

    if (header && !hasHeader) headerTarget.replaceChildren(header);
    if (footer && !hasFooter) footerTarget.replaceChildren(footer);

    if (popup && !hasPopup) document.body.insertAdjacentElement("beforeend", popup);
    if (btn && !hasBtn) document.body.insertAdjacentElement("beforeend", btn);

    const mode = getMode();
    const refParam = getRefParam();
    const homeLink = document.getElementById("homeLink");
    if (homeLink) {
      let qs = `nav=1&mode=${encodeURIComponent(mode)}`;
      if (refParam) qs += `&ref=${encodeURIComponent(refParam)}`;
      homeLink.setAttribute("href", `index.html?${qs}`);
    }
  }

  /* --------------------
     BANNER (OPTIONAL)
  ---------------------*/
  function createBanner(message) {
    if (!message) return;
    if (document.querySelector("#drop-banner")) return;

    const banner = document.createElement("div");
    banner.id = "drop-banner";
    banner.textContent = message;
    document.body.prepend(banner);
  }

  /* --------------------
     ✅ FORM SUBMISSION (mailto) – CORE + XP SAFE
  ---------------------*/
  function ensureMailtoFallbackUI(mailto) {
    const popupContent = document.querySelector("#contact-popup .popup-content");
    if (!popupContent) return;

    let wrap = document.getElementById("estimate-fallback");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "estimate-fallback";
      wrap.style.display = "none";
      wrap.style.marginTop = "10px";
      wrap.style.textAlign = "center";
      wrap.style.fontSize = "14px";
      wrap.style.color = "#333";

      wrap.innerHTML = `
        <div style="margin-top:10px;">
          If your email app didn’t open, tap:
          <a id="estimate-mailto-link" href="#" style="font-weight:700; text-decoration:underline;">
            Open Email
          </a>
        </div>
      `;

      popupContent.appendChild(wrap);
    }

    const link = document.getElementById("estimate-mailto-link");
    if (link) link.setAttribute("href", mailto);

    wrap.style.display = "block";
  }

  function setupContactFormMailto() {
    const TO_EMAIL = "newleafpaintingcompany@gmail.com";

    // CAPTURE PHASE submit handler = stops ALL other submit behaviors (gate reload)
    document.addEventListener("submit", (e) => {
      const form = e.target?.closest?.("#contact-popup form");
      if (!form) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const val = (sel) => (form.querySelector(sel)?.value || "").trim();

      const name = val("#name") || val('input[name="name"]');
      const email = val("#email") || val('input[name="email"]');
      const phone = val("#phone") || val('input[name="phone"]');
      const message = val("#message") || val('textarea[name="message"]');
      const discount = (document.getElementById("discount-code")?.value || "").trim();

      const subject = encodeURIComponent(refData.emailsubject || "New Leaf Painting Inquiry");
      const bodyLines = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        "",
        "Message:",
        message,
        "",
        discount ? `Discount Code: ${discount}` : "",
        refData.referrername
          ? `Referrer: ${refData.referrername}${refData.businessname ? " at " + refData.businessname : ""}`
          : ""
      ].filter(Boolean);

      const body = encodeURIComponent(bodyLines.join("\n"));
      const mailto = `mailto:${TO_EMAIL}?subject=${subject}&body=${body}`;

      // Try to open mail client in a way Safari tolerates
      // - In XP iframe, top is safest
      // - In core, normal is fine
      try {
        if (window.top && window.top !== window) {
          window.top.location.assign(mailto);
        } else {
          window.location.assign(mailto);
        }
      } catch (err) {
        // If blocked, show fallback link
        ensureMailtoFallbackUI(mailto);
      }

      // Always show fallback link (in case the browser blocks mailto)
      ensureMailtoFallbackUI(mailto);
    }, true);

    // Bonus: also catch SEND button clicks in capture phase (some browsers skip submit)
    document.addEventListener("click", (e) => {
      const sendBtn = e.target?.closest?.("#contact-popup button[type='submit'], #contact-popup input[type='submit']");
      if (!sendBtn) return;

      // let the submit handler do the work — but prevent any rogue click handlers
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const form = document.querySelector("#contact-popup form");
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }, true);
  }

  /* --------------------
     INIT
  ---------------------*/
  async function init() {
    const mode = getMode();
    document.body.classList.remove("mode-hub", "mode-standard");
    document.body.classList.add(mode === "hub" ? "mode-hub" : "mode-standard");

    await loadReferrerData();

    if ((refData.activeinactive || "").toLowerCase() === "inactive") {
      document.body.innerHTML = "<h2>This referral is no longer active.</h2>";
      return;
    }

    await injectGlobalHTML();

    forceNavVisible();
    highlightActiveLink();
    preserveParamsAcrossLinks();
    setupPopupHandlers();
    updatePopupHeadingAndButton(refData);
    setHiddenFieldsOnContactOpen(refData);

    // ✅ mailto wire
    setupContactFormMailto();

    if (refData.bannertext) createBanner(refData.bannertext);
  }

  init();
})();
