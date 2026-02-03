// global.js (robust injector + cache-bust + moves <style> into <head>)

(async function () {
  const headerMount = document.getElementById("global-header");
  const footerMount = document.getElementById("global-footer");

  if (!headerMount && !footerMount) return;

  try {
    // Kill aggressive caching (Safari/Netlify can be sticky)
    const res = await fetch("global.html", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load global.html: " + res.status);

    const html = await res.text();
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // ---- 1) Move ANY <style> blocks in global.html into <head> ----
    // (Safari sometimes won't respect injected styles inside body)
    temp.querySelectorAll("style").forEach((styleTag) => {
      const clone = styleTag.cloneNode(true);

      // Prevent duplicates if the user refreshes or multiple pages inject
      const sig = "global-style-signature";
      if (!clone.getAttribute("data-global-style")) clone.setAttribute("data-global-style", sig);

      const already = document.head.querySelector(`style[data-global-style="${sig}"]`);
      if (!already) document.head.appendChild(clone);

      styleTag.remove();
    });

    // ---- 2) Extract header/footer/contact elements ----
    const header = temp.querySelector("header");
    const footer = temp.querySelector("footer");

    const contactBtn = temp.querySelector("#contact-btn");
    const contactPopup = temp.querySelector("#contact-popup");

    // Clean mounts before injecting (prevents “flash” leftovers)
    if (headerMount) headerMount.innerHTML = "";
    if (footerMount) footerMount.innerHTML = "";

    // Inject header/footer
    if (headerMount && header) headerMount.appendChild(header);
    if (footerMount && footer) footerMount.appendChild(footer);

    // Inject contact UI into BODY (not inside header mount)
// Remove any existing duplicates first
document.querySelectorAll("#contact-btn, #contact-popup").forEach((el) => el.remove());

// Detect page
const currentPage = (location.pathname.split("/").pop() || "").toLowerCase();
const isXpHome = currentPage === "xp-home.html";

// ✅ Always inject the popup so links can open it
if (contactPopup) document.body.appendChild(contactPopup);

// ✅ Only inject floating button on NON xp-home pages
if (!isXpHome && contactBtn) document.body.appendChild(contactBtn);

    // ---- 3) Active link highlight (green glow) ----
    const path = (location.pathname.split("/").pop() || "").toLowerCase();
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      const hrefFile = href.split("/").pop();

      // match exact file names only
      const isActive = hrefFile && path && hrefFile === path;
      if (isActive) a.classList.add("active");
      else a.classList.remove("active");
    });

    // ---- 4) Contact popup wiring ----
    const popup = document.getElementById("contact-popup");
    const openers = document.querySelectorAll('[data-contact-open="1"], #contact-btn');
    const closer = popup ? popup.querySelector(".close") : null;

    const openPopup = (e) => {
      if (e) e.preventDefault();
      if (!popup) return;
      popup.style.display = "flex";
    };

    const closePopup = () => {
      if (!popup) return;
      popup.style.display = "none";
    };
// ---- 5) Estimate "Send" button -> opens email with prefilled subject/body ----
const sendBtn = document.getElementById("estimate-send");

if (sendBtn) {
  sendBtn.addEventListener("click", () => {
    const name = (document.getElementById("name")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim();
    const phone = (document.getElementById("phone")?.value || "").trim();
    const message = (document.getElementById("message")?.value || "").trim();

    // Optional: require at least name + one contact method
    if (!name || (!email && !phone)) {
      alert("Please enter your name and either an email or phone number.");
      return;
    }

    const to = "newleafpaintingcompany@gmail.com";

    // Subject with their info (tight + useful)
    const subject = encodeURIComponent(
      `Estimate Request - ${name}${phone ? " - " + phone : ""}`
    );

    const body = encodeURIComponent(
`Hi Mike,

I'd like a free estimate. Here’s my info:

Name: ${name}
Email: ${email || "(not provided)"}
Phone: ${phone || "(not provided)"}

Message:
${message || "(no message)"}

Thanks!`
    );

    // Use location.href so iOS Mail pops reliably
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    // Optional: close popup after click
    const popup = document.getElementById("contact-popup");
    if (popup) popup.style.display = "none";
  });
}
    openers.forEach((btn) => btn.addEventListener("click", openPopup));
    if (closer) closer.addEventListener("click", closePopup);

    window.addEventListener("click", (e) => {
      if (!popup) return;
      if (e.target === popup) closePopup();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePopup();
    });

  } catch (err) {
    console.error(err);
  }
})();
