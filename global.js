/* --------------------
   LOAD GLOBAL HTML (header, footer, popup)
---------------------*/
async function loadGlobalHTML(refData = {}) {
  try {
    const res = await fetch("global.html");
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const header = doc.querySelector("header");
    const footer = doc.querySelector("footer");
    const popup = doc.querySelector("#contact-popup");
    const btn = doc.querySelector("#contact-btn");

    // Inject header/footer immediately
    const headerTarget = document.getElementById("global-header");
    const footerTarget = document.getElementById("global-footer");
    if (headerTarget && header) headerTarget.replaceChildren(header);
    if (footerTarget && footer) footerTarget.replaceChildren(footer);

    // Inject popup/button once
    if (popup && !document.querySelector("#contact-popup")) {
      document.body.insertAdjacentElement("beforeend", popup);
    }
    if (btn && !document.querySelector("#contact-btn")) {
      document.body.insertAdjacentElement("beforeend", btn);
      // Apply referral button text immediately
      if (refData.buttontext) btn.textContent = refData.buttontext;
    }

    // Reveal nav links and highlight active
    requestAnimationFrame(() => {
      document.querySelectorAll(".nav-links a").forEach(a => {
        a.style.visibility = "visible";
      });
      highlightActiveLink(); // works now even with ?ref=CD-001
    });

    // Initialize other functions
    setupPopup();
    preserveRefAcrossLinks();

  } catch (err) {
    console.error("Error loading global.html:", err);
  }
}

/* --------------------
   HIGHLIGHT ACTIVE LINK
---------------------*/
function highlightActiveLink() {
  let currentPage = window.location.pathname.split("/").pop().toLowerCase();
  if (!currentPage) currentPage = "index.html"; // treat root as index.html

  const links = document.querySelectorAll("nav a");
  links.forEach(link => {
    let linkPage = link.getAttribute("href").split("?")[0].split("/").pop().toLowerCase();
    if (!linkPage) linkPage = "index.html"; // treat empty href as index.html

    if (linkPage === currentPage) link.classList.add("active");
    else link.classList.remove("active");

    // ensure visibility
    link.style.visibility = "visible";
  });
}

/* --------------------
   SETUP POPUP FUNCTIONALITY
---------------------*/
function setupPopup() {
  const popup = document.getElementById("contact-popup");
  const btnDefault = document.getElementById("contact-btn");
  const popupClose = document.querySelector("#contact-popup .close");
  if (!popup || !btnDefault || !popupClose) return;

  btnDefault.onclick = () => popup.style.display = "flex";
  popupClose.onclick = () => popup.style.display = "none";
  window.onclick = e => { if (e.target === popup) popup.style.display = "none"; };
}

/* --------------------
   PRESERVE REF PARAM ACROSS LINKS
---------------------*/
function preserveRefAcrossLinks() {
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref') || urlParams.get('drop') || urlParams.get('sample');
  if (!refParam) return;

  document.querySelectorAll("a[href]").forEach(link => {
    const href = link.getAttribute("href");
    if (href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.includes("javascript:")) {
      const url = new URL(href, window.location.origin);
      if (!url.searchParams.has("ref") && !url.searchParams.has("drop") && !url.searchParams.has("sample")) {
        url.searchParams.set("ref", refParam);
      }
      link.setAttribute("href", url.pathname + url.search);
    }
  });
}

/* --------------------
   URL PARAMETER
---------------------*/
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get('ref') || urlParams.get('drop') || urlParams.get('sample');

/* --------------------
   PAGE CHECK (HOME VS OTHERS)
---------------------*/
const isHomePage =
  window.location.pathname === "/" ||
  window.location.pathname.endsWith("/index.html") ||
  window.location.pathname.endsWith("index.html");

/* --------------------
   GOOGLE SHEET (CSV)
---------------------*/
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGQaoBZ7rMgXkLt9ZvLeF9zZ5V5qv1m4mlWWowx-VskRE6hrd1rHOVAg3M4JJfXCotw8wVVK_nVasH/pub?output=csv";

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
  return value ? value.replace(/^"|"$/g, '').trim() : '';
}

/* --------------------
   CREATE BANNER
---------------------*/
function createBanner(message) {
  if (!message) return;
  if (document.querySelector("#drop-banner")) return;
  const banner = document.createElement('div');
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
   UPDATE BUTTON TEXT
---------------------*/
function updateButtonText(text) {
  const btnDefault = document.getElementById("contact-btn");
  if (text && btnDefault) btnDefault.textContent = text;
}

/* --------------------
   UPDATE POPUP HEADING
---------------------*/
function updatePopupHeading() {
  const popupHeading = document.querySelector('#contact-popup h2');
  if (!popupHeading) return;

  if (refData.discountcode.toUpperCase().includes("DROP")) popupHeading.textContent = "Redeem Drop Reward";
  else if (refData.discountcode.toUpperCase().includes("SAMPLE")) popupHeading.textContent = "Redeem Sample Reward";
  else popupHeading.textContent = "Get free estimate";
}

/* --------------------
   LOAD REFERRER DATA FROM CSV
---------------------*/
async function loadReferrerData() {
  if (!refParam) return;

  try {
    const res = await fetch(sheetURL);
    const text = await res.text();
    const rows = text.trim().split('\n').map(r => r.split(','));
    const headers = rows.shift().map(h => h.trim().toLowerCase());

    const match = rows.find(row => row[0]?.trim().toLowerCase() === refParam.toLowerCase());
    if (!match) return;

    headers.forEach((h, i) => { refData[h] = cleanValue(match[i]); });
  } catch (err) {
    console.error("Error loading spreadsheet:", err);
  }
}

/* --------------------
   APPLY MODE (HOME ONLY) + FORCE BORING ON OTHER PAGES
---------------------*/
function applyNLMode() {
  // Non-home pages should never show "experience" UI
  if (!isHomePage) {
    document.body.classList.add("mode-standard");
    // also ensure any old leftover state doesn't try to do something weird
    document.body.classList.remove("mode-hub");
    return;
  }

  // Home page: honor stored choice if present
  const stored = sessionStorage.getItem("nl_mode"); // "hub" or "standard" or null
  if (!stored) return;

  document.body.classList.remove("mode-hub", "mode-standard");
  document.body.classList.add(stored === "hub" ? "mode-hub" : "mode-standard");
}

/* --------------------
   INITIALIZE PAGE
---------------------*/
async function init() {
  document.body.style.visibility = "hidden"; // hide until refData is ready

  await loadReferrerData(); // fetch ref data first

  if (refData.activeinactive?.toLowerCase() === 'inactive') {
    document.body.innerHTML = '<h2>This referral is no longer active.</h2>';
    document.body.style.visibility = "visible";
    return;
  }

  await loadGlobalHTML(refData); // pass refData so button text updates immediately
  applyNLMode();

  if (refData.bannertext) createBanner(refData.bannertext);
  updatePopupHeading();

  document.body.style.visibility = "visible"; // reveal page
}

init();

/* --------------------
   FORM SUBMISSION
---------------------*/
document.addEventListener("submit", e => {
  if (e.target.closest("#contact-popup form")) {
    e.preventDefault();

    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const phone = document.getElementById('phone')?.value;
    const message = document.getElementById('message')?.value;
    const discount = document.getElementById('discount-code')?.value;

    const subject = encodeURIComponent(refData.emailsubject || "New Leaf Painting Inquiry");
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Message: ${message}`,
      `Discount Code: ${discount}`,
      refData.referrername ? `Referrer: ${refData.referrername}${refData.businessname ? " at " + refData.businessname : ""}` : ""
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
    const discountField = document.getElementById('discount-code');
    if (discountField) discountField.value = refData.discountcode || "";

    let refField = document.getElementById('referrer');
    if (!refField) {
      refField = document.createElement('input');
      refField.type = 'hidden';
      refField.name = 'referrer';
      refField.id = 'referrer';
      document.querySelector('#contact-popup form').appendChild(refField);
    }
    refField.value = `${refData.referrername}${refData.businessname ? " at " + refData.businessname : ""}`;
  }
});

/* --------------------
   PARTNER POPUP + EMAIL
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

  const mailtoLink = `mailto:newleafpaintingcompany@gmail.com?subject=Partner Application - ${encodeURIComponent(biz)}&body=${encodeURIComponent(
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

// Close modal if clicking outside
window.addEventListener("click", e => {
  const modal = document.getElementById("partnerModal");
  if (e.target === modal) closePartnerModal();
});
