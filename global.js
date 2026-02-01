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

    if (contactBtn) document.body.appendChild(contactBtn);
    if (contactPopup) document.body.appendChild(contactPopup);

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
