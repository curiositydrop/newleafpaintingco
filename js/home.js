(function () {
  const menuBtn = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  menuBtn?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.querySelectorAll("[data-book]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      const popup = document.getElementById("book-popup");
      if (popup) popup.hidden = false;
    });
  });
  const popup = document.getElementById("book-popup");
  popup?.querySelector(".close")?.addEventListener("click", () => {
    popup.hidden = true;
  });
  popup?.addEventListener("click", (event) => {
    if (event.target === popup) popup.hidden = true;
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup && !popup.hidden) popup.hidden = true;
  });

  const pricing = window.NEW_LEAF_PRICING || {};
  const area = pricing.floorAreaSqFt || { min: 40, max: 3000, step: 10, start: 150 };
  const slider = document.getElementById("floor-area");
  const areaOut = document.getElementById("floor-area-value");
  const priceOut = document.getElementById("ballpark-price");
  const quoteLink = document.getElementById("ballpark-link");
  const roomButtons = Array.from(document.querySelectorAll("[data-room-rate]"));
  let roomKey = roomButtons[0]?.dataset.roomRate || "bedroom";

  if (slider) {
    slider.min = String(area.min);
    slider.max = String(area.max);
    slider.step = String(area.step);
    slider.value = String(area.start);
  }

  function selectedLabel() {
    const btn = roomButtons.find((b) => b.dataset.roomRate === roomKey);
    return btn ? btn.textContent.trim() : "Bedroom";
  }

  function renderQuote() {
    const sqft = Number(slider?.value || area.start);
    const height = pricing.assumedCeilingHeightFt || 8;
    if (areaOut) areaOut.textContent = sqft.toLocaleString("en-US") + " sq ft · " + height + " ft ceiling";
    if (priceOut) {
      if (roomKey === "wholeHouse") {
        priceOut.textContent = "Mike reviews whole-home projects before confirming a price.";
      } else if (window.NewLeafPricing) {
        const range = window.NewLeafPricing.roughRange(sqft);
        priceOut.textContent = "Rough range: " + window.NewLeafPricing.money(range.low) + " – " + window.NewLeafPricing.money(range.high);
      }
    }
    if (quoteLink) {
      const params = new URLSearchParams({ room: selectedLabel(), sqft: String(sqft) });
      quoteLink.href = "photo-estimate.html?" + params.toString();
    }
  }

  roomButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      roomKey = btn.dataset.roomRate;
      roomButtons.forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
      renderQuote();
    });
  });
  slider?.addEventListener("input", renderQuote);
  renderQuote();

  const before = document.getElementById("color-before");
  const canvas = document.getElementById("color-after");
  const split = document.getElementById("color-split");
  const swatches = Array.from(document.querySelectorAll("[data-swatch]"));
  if (!before || !canvas || !split) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let source = null;
  let swatch = swatches.find((s) => s.getAttribute("aria-pressed") === "true")?.dataset.swatch || "#b0c2a8";

  function hexToRgb(hex) {
    const n = hex.replace("#", "");
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }

  function wallMask(data, w, h) {
    const mask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const isWall = b > r + 8 && b >= g && b > 28 && b < 150 && r < 95 && g < 115 && b - r > 10;
        mask[y * w + x] = isWall ? 1 : 0;
      }
    }
    const smooth = (src) => {
      const next = new Uint8Array(src.length);
      for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
          let n = 0;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) n += src[(y + dy) * w + (x + dx)];
          }
          const i = y * w + x;
          next[i] = n >= 14 ? 1 : n <= 5 ? 0 : src[i];
        }
      }
      return next;
    };
    let current = mask;
    current = smooth(current);
    current = smooth(current);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (y > h * 0.73 && x > w * 0.2) current[y * w + x] = 0;
      }
    }
    return current;
  }

  function paint() {
    if (!source) return;
    const maxW = 900;
    const scale = Math.min(1, maxW / source.width);
    const w = Math.round(source.width * scale);
    const h = Math.round(source.height * scale);
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(source, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h);
    const data = frame.data;
    const mask = wallMask(data, w, h);
    const [sr, sg, sb] = hexToRgb(swatch);
    const swLum = 0.299 * sr + 0.587 * sg + 0.114 * sb || 1;
    for (let p = 0; p < mask.length; p++) {
      if (!mask[p]) continue;
      const i = p * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const factor = Math.min(1.25, Math.max(0.7, lum / swLum));
      data[i] = Math.min(255, sr * factor);
      data[i + 1] = Math.min(255, sg * factor);
      data[i + 2] = Math.min(255, sb * factor);
    }
    ctx.putImageData(frame, 0, 0);
  }

  function setSplit() {
    canvas.style.clipPath = "inset(0 0 0 " + split.value + "%)";
    split.setAttribute("aria-valuetext", split.value + " percent original");
  }

  before.addEventListener("load", () => {
    source = before;
    paint();
  });
  if (before.complete && before.naturalWidth) {
    source = before;
    paint();
  }
  split.addEventListener("input", setSplit);
  setSplit();
  if (location.hash === "#book") {
    const book = document.getElementById("book-popup");
    if (book) book.hidden = false;
  }
  swatches.forEach((btn) => {
    btn.addEventListener("click", () => {
      swatch = btn.dataset.swatch;
      swatches.forEach((s) => s.setAttribute("aria-pressed", s === btn ? "true" : "false"));
      paint();
    });
  });
})();
