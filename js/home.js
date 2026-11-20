(function () {
  const menuBtn = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  menuBtn?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  function openBook(message) {
    const book = document.getElementById("book-popup");
    const details = book?.querySelector('[name="Project Details"]');
    if (details && message) details.value = message;
    if (book) book.hidden = false;
  }
  document.querySelectorAll("form[name='in-person-estimate']").forEach((form) => {
    form.addEventListener("submit", (event) => {
      const picked = form.querySelectorAll('input[name="Service"]:checked');
      const note = form.querySelector(".service-error");
      if (!picked.length) {
        event.preventDefault();
        if (note) note.hidden = false;
      } else if (note) note.hidden = true;
    });
  });
  document.querySelectorAll("[data-book]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      openBook(el.getAttribute("data-book-message") || "");
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
  const roomQuote = document.getElementById("room-quote");
  const wholeHouse = document.getElementById("whole-house");
  const roomButtons = Array.from(document.querySelectorAll("[data-room-rate]"));
  let roomKey = roomButtons[0]?.dataset.roomRate || "bedroom";
  let sliderTouched = false;
  let roomPicked = false;

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
    const whole = roomKey === "wholeHouse";
    if (roomQuote) roomQuote.hidden = whole;
    if (wholeHouse) wholeHouse.hidden = !whole;
    if (areaOut) areaOut.textContent = sqft.toLocaleString("en-US") + " sq ft · " + height + " ft ceiling";
    if (priceOut && window.NewLeafPricing) {
      const range = window.NewLeafPricing.roughRange(sqft);
      const about = window.NewLeafPricing.aboutRange(range.low, range.high);
      const low = about.low.toLocaleString("en-US");
      const high = about.high.toLocaleString("en-US");
      priceOut.textContent = "Rough range: About $" + low + "–$" + high;
    }
    if (quoteLink) {
      if (sliderTouched || roomPicked) {
        const params = new URLSearchParams({ room: selectedLabel(), sqft: String(sqft) });
        quoteLink.href = "photo-estimate.html?" + params.toString();
      } else {
        quoteLink.href = "photo-estimate.html";
      }
    }
  }

  roomButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      roomKey = btn.dataset.roomRate;
      roomPicked = true;
      roomButtons.forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
      renderQuote();
    });
  });
  slider?.addEventListener("input", () => {
    sliderTouched = true;
    renderQuote();
  });
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

  const maskImage = new Image();
  maskImage.src = "images/bedroom-wall-mask.png";
  maskImage.onload = () => paint();

  function paint() {
    if (!source || !maskImage.complete || !maskImage.naturalWidth) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = before.clientWidth || source.width;
    const cssH = Math.round(cssW * (source.height / source.width));
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
    maskCtx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
    const mask = maskCtx.getImageData(0, 0, canvas.width, canvas.height).data;
    const [sr, sg, sb] = hexToRgb(swatch);
    let lumSum = 0;
    let lumCount = 0;
    const lums = new Float32Array(data.length / 4);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      if (mask[i] < 128) continue;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      lums[p] = lum;
      lumSum += lum;
      lumCount += 1;
    }
    const avg = lumCount ? lumSum / lumCount : 1;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      if (mask[i] < 128) continue;
      const shade = Math.min(1.35, Math.max(0.42, lums[p] / avg));
      const grainR = (data[i] * sr) / 255;
      const grainG = (data[i + 1] * sg) / 255;
      const grainB = (data[i + 2] * sb) / 255;
      data[i] = Math.min(255, sr * shade * 0.92 + grainR * 0.08);
      data[i + 1] = Math.min(255, sg * shade * 0.92 + grainG * 0.08);
      data[i + 2] = Math.min(255, sb * shade * 0.92 + grainB * 0.08);
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
  if (location.hash === "#book" || location.hash === "#walkthrough") {
    openBook(location.hash === "#walkthrough" ? "Whole-home walkthrough" : "");
  }
  const chart = document.getElementById("color-chart");
  const colorNow = document.getElementById("color-now");
  function applyColor(hex, label) {
    swatch = hex;
    if (colorNow) colorNow.textContent = label;
    swatches.forEach((s) => s.setAttribute("aria-pressed", s.dataset.swatch.toLowerCase() === hex.toLowerCase() ? "true" : "false"));
    paint();
  }
  function openChart() {
    if (!chart || chart.childElementCount) {
      if (chart) chart.hidden = false;
      return;
    }
    const groups = {};
    (window.SW_COLORS || []).forEach((color) => {
      (groups[color.group] = groups[color.group] || []).push(color);
    });
    Object.keys(groups).forEach((group) => {
      const block = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = group;
      const grid = document.createElement("div");
      grid.className = "swatch-grid";
      groups[group].forEach((color) => {
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = "<i style=\"background:" + color.hex + "\"></i><span>" + color.name + "<br>" + color.code + "</span>";
        button.addEventListener("click", () => applyColor(color.hex, color.name + " · " + color.code));
        grid.appendChild(button);
      });
      block.appendChild(title);
      block.appendChild(grid);
      chart.appendChild(block);
    });
    chart.hidden = false;
  }
  swatches.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyColor(btn.dataset.swatch, btn.getAttribute("aria-label"));
      openChart();
    });
  });
  document.getElementById("open-colors")?.addEventListener("click", openChart);
  window.addEventListener("resize", paint);
})();
