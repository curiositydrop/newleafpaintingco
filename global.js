/* =========================================================
   NEW LEAF GLOBAL.JS (SAFE MODE + HARD CSS OVERRIDES)
   - Prevents double-inject of header/footer/popup/button
   - Preserves: nav=1, mode=hub|standard, and ref/drop/sample
   - FIX: Forces nav + CTA visible on INNER pages when mode=hub
   ========================================================= */

/* --------------------
   MODE + NAV HELPERS
---------------------*/
function getNLModeFromURL() {
  const p = new URLSearchParams(window.location.search);
  const mode = (p.get("mode") || "standard").toLowerCase();
  return (mode === "hub" || mode === "standard") ? mode : "standard";
}

function buildNLNavQS(mode) {
  return `nav=1&mode=${encodeURIComponent(mode)}`;
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

/* --------------------
   URL PARAMS (existing)
---------------------*/
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get("ref") || urlParams.get("drop") || urlParams.get("sample");

const isHomePage =
  window.location.pathname === "/" ||
  window.location.pathname.endsWith("/index.html") ||
  window.location.pathname.endsWith("index.html");

/* --------------------
   GOOGLE SHEET (CSV)
---------------------*/
const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGQaoBZ7rMgXkLt9ZvLeF9zZ5V5qv1m4mlWWowx-VskRE6hrd1rHOVAg3M4JJfXCotw8wVVK_nVasH/pub?output=csv";

/* --------------------
   DEFAULT REF DATA
---------------------*/
let refData = {
  id: "",
  referrername: "",
  businessname: "",
  discountcode: "",
  bannertext: "",
  buttontext: "Get free estimate",
  emailsubject: "New Leaf Painting Inquiry",
  activeinactive: ""
};

/* --------------------
   CLEAN VALUE
---------------------*/
function cleanValue(value) {
  return value ? value.replace(/^"|"$/g, "").trim() : "";
}

/* --------------------
   CSS OVERRIDES (THE FIX)
   Forces nav/CTA visible on INNER pages when mode=hub
---------------------*/
function injectHubInnerPageOverrides() {
  const mode = getNLModeFromURL();
  if (mode !== "hub") return;

  // Only apply to INNER pages (past-projects, testimonials, etc.)
  if (isHomePage) return;

  if (document.getElementById("nl-hub-inner-overrides")) return;

  const style = document.createElement("style");
  style.id = "nl-hub-inner-overrides";
  style.textContent = `
    /* Force global header/nav visible even if CSS tries to hide it */
    body.mode-hub #global-header,
    body.mode-hub #global-header header,
    body.mode-hub #global-header nav,
    body.mode-hub #global-header .nav-links,
    body.mode-hub #global-header .nav-links a {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    body.mode-hub #global-header .nav-links {
      display: flex !important;
    }

    body.mode-hub #global-footer,
    body.mode-hub #global-footer footer {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    /* Contact button must exist in inner pages too */
    body.mode-hub #contact-btn {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    /* Popup stays closed until user opens */
    body.mode-hub #contact-popup {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

/* --------------------
   CREATE BANNER
---------------------*/
function createBanner(message) {
  if (!message) return;
  if (document.querySelector("#drop-banner")) return;

  const banner = document.createElement("div");
  banner.id = "drop-banner";
  banner.textContent = message;
  Object.assign(banner.style, {
    backgroundColor: "#4CAF50",
    color: "#fff",
    textAlign: "center",
    padding: "10px",
    fontWeight: "bold",
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    zIndex: "200"
  });
  document.body.prepend(banner);
}

/* --------------------
   UPDATE POPUP HEADING
---------------------*/
function updatePopupHeading() {
  const popupHeading = document.querySelector("#contact-popup h2");
  if (!popupHeading) return;

  if ((refData.discountcode || "").toUpperCase().includes("DROP")) popupHeading.textContent = "Redeem Drop Reward";
  else if ((refData.discountcode || "").toUpperCase().includes("SAMPLE"))
    popupHeading.textContent = "Redeem Sample Reward";
  else popupHeading.textContent = "Get free estimate";
}

/* --------------------
   HIGHLIGHT ACTIVE LINK
---------------------*/
function highlightActiveLink() {
  let currentPage = window.location.pathname.split("/").pop().toLowerCase();
  if (!currentPage) currentPage = "index.html";

  document.querySelectorAll("nav a").forEach(link => {
    let linkPage = (link.getAttribute("href") || "").split("?")[0].split("/").pop().toLowerCase();
    if (!linkPage) linkPage = "index.html";

    link.classList.toggle("active", linkPage === currentPage);
    link.style.visibility = "visible";
  });
}

/* --------------------
   SETUP POPUP (IMPORTANT OVERRIDE)
---------------------*/
function setupPopup() {
  const popup = document.getElementById("contact-popup");
  const btnDefault = document.getElementById("contact-btn");
  const popupClose = document.querySelector("#contact-popup .close");
  if (!popup || !btnDefault || !popupClose) return;

  btnDefault.onclick = () => popup.style.setProperty("display", "flex", "important");
  popupClose.onclick = () => popup.style.setProperty("display", "none", "important");

  window.addEventListener("click", e => {
    if (e.target === popup) popup.style.setProperty("display", "none", "important");
  });
}

/* --------------------
   FORCE HOME LINK TO MODE
---------------------*/
function forceHomeLinkToMode() {
  const mode = getNLModeFromURL();
  const homeLink = document.getElementById("homeLink") || document.querySelector('nav a[href^="index.html"]');
  if (!homeLink) return;

  let qs = buildNLNavQS(mode);
  if (refParam) qs += `&ref=${encodeURIComponent(refParam)}`;

  homeLink.setAttribute("href", `index.html?${qs}`);
}

/* --------------------
   PRESERVE MODE + REF ACROSS LINKS
---------------------*/
function preserveParamsAcrossLinks() {
  const mode = getNLModeFromURL();

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

/* --------------------
   APPLY MODE CLASS
---------------------*/
function applyNLMode() {
  const mode = getNLModeFromURL();
  document.body.classList.remove("mode-hub", "mode-standard");
  document.body.classList.add(mode === "hub" ? "mode-hub" : "mode-standard");
}

/* --------------------
   LOAD GLOBAL HTML (SAFE)
---------------------*/
async function loadGlobalHTML(refData = {}) {
  try {
    const headerTarget = document.getElementById("global-header");
    const footerTarget = document.getElementById("global-footer");

    const headerAlready = headerTarget && headerTarget.querySelector("header");
    const footerAlready = footerTarget && footerTarget.querySelector("footer");
    const popupAlready = !!document.querySelector("#contact-popup");
    const btnAlready = !!document.querySelector("#contact-btn");

    const alreadyInjected = headerAlready && footerAlready && popupAlready && btnAlready;

    if (!alreadyInjected) {
      const res = await fetch("global.html");
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const header = doc.querySelector("header");
      const footer = doc.querySelector("footer");
      const popup = doc.querySelector("#contact-popup");
      const btn = doc.querySelector("#contact-btn");

      if (headerTarget && header && !headerAlready) headerTarget.replaceChildren(header);
      if (footerTarget && footer && !footerAlready) footerTarget.replaceChildren(footer);

      if (popup && !popupAlready) document.body.insertAdjacentElement("beforeend", popup);
      if (btn && !btnAlready) {
        document.body.insertAdjacentElement("beforeend", btn);
        if (refData.buttontext) btn.textContent = refData.buttontext;
      }
    } else {
      const btn = document.getElementById("contact-btn");
      if (btn && refData.buttontext) btn.textContent = refData.buttontext;
    }

    forceHomeLinkToMode();

    requestAnimationFrame(() => {
      document.querySelectorAll(".nav-links a").forEach(a => (a.style.visibility = "visible"));
      highlightActiveLink();
    });

    setupPopup();
    preserveParamsAcrossLinks();
  } catch (err) {
    console.error("Error loading global.html:", err);
  }
}

/* --------------------
   LOAD REFERRER DATA FROM CSV
---------------------*/
async function loadReferrerData() {
  if (!refParam) return;

  try {
    const res = await fetch(sheetURL);
    const text = await res.text();
    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows.shift().map(h => h.trim().toLowerCase());

    const match = rows.find(row => row[0]?.trim().toLowerCase() === refParam.toLowerCase());
    if (!match) return;

    headers.forEach((h, i) => {
      refData[h] = cleanValue(match[i]);
    });
  } catch (err) {
    console.error("Error loading spreadsheet:", err);
  }
}

/* --------------------
   INITIALIZE
---------------------*/
async function init() {
  document.body.style.visibility = "hidden";

  // ✅ Inject CSS overrides ASAP (only affects hub inner pages)
  injectHubInnerPageOverrides();

  await loadReferrerData();

  if (refData.activeinactive?.toLowerCase() === "inactive") {
    document.body.innerHTML = "<h2>This referral is no longer active.</h2>";
    document.body.style.visibility = "visible";
    return;
  }

  applyNLMode();

  await loadGlobalHTML(refData);

  // Run overrides again after header exists (safe no-op if already injected)
  injectHubInnerPageOverrides();

  if (refData.bannertext) createBanner(refData.bannertext);
  updatePopupHeading();

  document.body.style.visibility = "visible";
}

init();

/* --------------------
   FORM SUBMISSION
---------------------*/
document.addEventListener("submit", e => {
  if (e.target.closest("#contact-popup form")) {
    e.preventDefault();

    const name = document.getElementById("name")?.value;
    const email = document.getElementById("email")?.value;
    const phone = document.getElementById("phone")?.value;
    const message = document.getElementById("message")?.value;
    const discount = document.getElementById("discount-code")?.value;

    const subject = encodeURIComponent(refData.emailsubject || "New Leaf Painting Inquiry");
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Message: ${message}`,
      `Discount Code: ${discount}`,
      refData.referrername
        ? `Referrer: ${refData.referrername}${refData.businessname ? " at " + refData.businessname : ""}`
        : ""
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));

    window.location.href = `mailto:newleafpaintingcompany@gmail.com?subject=${subject}&body=${body}`;
  }
});

/* --------------------
   SET HIDDEN FIELDS ON CLICK
---------------------*/
document.addEventListener("click", e => {
  if (e.target.id === "contact-btn") {
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
    if (refField) refField.value = `${refData.referrername}${refData.businessname ? " at " + refData.businessname : ""}`;
  }
});

/* --------------------
   PARTNER POPUP + EMAIL (kept)
---------------------*/
function openPartnerModal() {
  const modal = document.getElementById("partnerModal");
  if (modal) modal.style.display = "flex";
}

function closePartnerModal() {
  const modal = document.getElementById("partnerModal");
  if (modal) modal.style.display = "none";
}

function sendPartnerEmail(event) {
  event.preventDefault();

  const biz = document.getElementById("bizName")?.value;
  const name = document.getElementById("contactName")?.value;
  const email = document.getElementById("contactEmail")?.value;
  const phone = document.getElementById("contactPhone")?.value;
  const website = document.getElementById("bizWebsite")?.value;
  const message = document.getElementById("bizMessage")?.value;

  const mailtoLink = `mailto:newleafpaintingcompany@gmail.com?subject=Partner Application - ${encodeURIComponent(
    biz
  )}&body=${encodeURIComponent(
    `Business Name: ${biz}
Contact: ${name}
Email: ${email}
Phone: ${phone}
Website/Social: ${website}
Message:
${message}`
  )}`;

  window.location.href = mailtoLink;
  closePartnerModal();
}

window.addEventListener("click", e => {
  const modal = document.getElementById("partnerModal");
  if (e.target === modal) closePartnerModal();
});
