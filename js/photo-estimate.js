(function () {
  const menuBtn = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  menuBtn?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  const form = document.getElementById("photo-estimate");
  if (!form) return;
  const rooms = Array.from(form.querySelectorAll(".room"));
  const addBtn = document.getElementById("add-room");
  const error = document.getElementById("form-error");
  const sizeNote = document.getElementById("size-note");
  const MAX_BYTES = 7 * 1024 * 1024;

  function setRoomEnabled(room, on) {
    room.hidden = !on;
    room.querySelectorAll("input, textarea, select, button").forEach((el) => {
      if (el.classList.contains("remove-room") || el.classList.contains("choice") || el.classList.contains("step-btn")) return;
      el.disabled = !on;
    });
    if (!on) {
      room.querySelectorAll('input[type="file"]').forEach((input) => {
        input.value = "";
      });
    }
  }

  rooms.forEach((room, index) => setRoomEnabled(room, index === 0));

  function openCount() {
    return rooms.filter((room) => !room.hidden).length;
  }

  function refreshAdd() {
    if (addBtn) addBtn.hidden = openCount() >= rooms.length;
    rooms.forEach((room) => {
      const remove = room.querySelector(".remove-room");
      if (remove) remove.hidden = openCount() < 2;
    });
  }

  addBtn?.addEventListener("click", () => {
    const next = rooms.find((room) => room.hidden);
    if (!next) return;
    setRoomEnabled(next, true);
    updateRoom(next);
    refreshAdd();
    next.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  rooms.forEach((room) => {
    room.querySelector(".remove-room")?.addEventListener("click", () => {
      if (openCount() < 2) return;
      setRoomEnabled(room, false);
      refreshAdd();
    });

    room.querySelectorAll("[data-room-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.roomType === "Whole House") {
          room.querySelectorAll("[data-room-type]").forEach((b) => b.setAttribute("aria-pressed", "false"));
          const hidden = room.querySelector(".room-type-value");
          if (hidden) hidden.value = "";
          showWholeHouse();
          return;
        }
        room.querySelectorAll("[data-room-type]").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
        const hidden = room.querySelector(".room-type-value");
        if (hidden) hidden.value = btn.dataset.roomType;
      });
    });

    room.querySelectorAll(".step-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        const next = Math.max(0, Number(input.value || 0) + Number(btn.dataset.step));
        input.value = String(next);
        updateRoom(room);
      });
    });

    room.querySelectorAll("input.unsure").forEach((box) => {
      box.addEventListener("change", () => {
        const input = box.closest(".measure").querySelector("input[type='text'], input.measure-input");
        if (!input) return;
        if (box.checked) {
          input.dataset.prev = input.value === "Unsure" ? "" : input.value;
          input.value = "Unsure";
          input.readOnly = true;
        } else {
          input.value = input.dataset.prev || "";
          input.readOnly = false;
        }
        updateRoom(room);
      });
    });

    room.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        const extra = room.querySelector(".closet-fields");
        if (extra) extra.hidden = radio.value !== "Yes" || !radio.checked;
        updateRoom(room);
      });
    });

    room.addEventListener("input", (event) => {
      const target = event.target;
      if (target && target.name && /-baseboard-feet$/.test(target.name) && target.value !== "Unsure") {
        target.dataset.edited = "1";
      }
      updateRoom(room);
    });
    room.addEventListener("change", () => updateRoom(room));
  });

  function numOrUnsure(value) {
    if (value === "Unsure") return "Unsure";
    if (value === "" || value == null) return "";
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : "";
  }

  function areas(length, width, height) {
    const parts = { length, width, height };
    const missing = Object.entries(parts).filter(([, v]) => typeof v !== "number").map(([k]) => k);
    if (missing.length) return { text: "Unsure (" + missing.join(", ") + ")", wall: null, ceiling: null };
    const wall = 2 * (length + width) * height;
    const ceiling = length * width;
    return {
      wall: Math.round(wall),
      ceiling: Math.round(ceiling),
      text: "Walls " + Math.round(wall) + " sq ft; ceiling " + Math.round(ceiling) + " sq ft"
    };
  }

  function field(room, name) {
    return room.querySelector('[name="' + name + '"]');
  }

  function updateRoom(room) {
    const n = room.dataset.room;
    const length = numOrUnsure(field(room, "room-" + n + "-length")?.value.trim());
    const width = numOrUnsure(field(room, "room-" + n + "-width")?.value.trim());
    const height = numOrUnsure(field(room, "room-" + n + "-ceiling-height")?.value.trim());
    const roomArea = areas(length, width, height);
    const wallInput = field(room, "room-" + n + "-wall-area");
    const ceilInput = field(room, "room-" + n + "-ceiling-area");
    if (wallInput) wallInput.value = roomArea.wall == null ? roomArea.text : roomArea.wall + " sq ft";
    if (ceilInput) ceilInput.value = roomArea.ceiling == null ? roomArea.text : roomArea.ceiling + " sq ft";

    const closetYes = room.querySelector('input[name="room-' + n + '-closet"][value="Yes"]')?.checked;
    const closetWrap = room.querySelector(".closet-fields");
    if (closetWrap) closetWrap.hidden = !closetYes;
    let closetText = "No closet";
    if (closetYes) {
      const cl = numOrUnsure(field(room, "room-" + n + "-closet-length")?.value.trim());
      const cw = numOrUnsure(field(room, "room-" + n + "-closet-width")?.value.trim());
      const ch = numOrUnsure(field(room, "room-" + n + "-closet-height")?.value.trim());
      const closet = areas(cl, cw, ch);
      closetText = closet.wall == null ? "Unsure (" + closet.text.replace("Unsure ", "") + ")" : "Walls " + closet.wall + " sq ft; ceiling " + closet.ceiling + " sq ft";
    }
    const closetInput = field(room, "room-" + n + "-closet-area");
    if (closetInput) closetInput.value = closetText;
    room.querySelectorAll(".closet-fields input").forEach((input) => {
      input.disabled = !closetYes || room.hidden;
    });

    const paint = Array.from(room.querySelectorAll('input[name="room-' + n + '-paint"]:checked')).map((el) => el.value);
    const baseOn = paint.includes("Baseboards");
    const casingOn = paint.includes("Casing");
    const baseWrap = room.querySelector('[data-extra="baseboards"]');
    const casingWrap = room.querySelector('[data-extra="casing"]');
    if (baseWrap) baseWrap.hidden = !baseOn;
    if (casingWrap) casingWrap.hidden = !casingOn;
    const baseInput = field(room, "room-" + n + "-baseboard-feet");
    const casingInput = field(room, "room-" + n + "-casing-feet");
    if (baseInput && baseOn && baseInput.dataset.edited !== "1" && baseInput.value !== "Unsure") {
      const len = Number(field(room, "room-" + n + "-length")?.value);
      const wid = Number(field(room, "room-" + n + "-width")?.value);
      if (len > 0 && wid > 0) baseInput.value = String(2 * (len + wid));
    }
    [baseWrap, casingWrap].forEach((wrap, index) => {
      const on = index === 0 ? baseOn : casingOn;
      wrap?.querySelectorAll("input").forEach((input) => {
        input.disabled = !on || room.hidden;
      });
    });

    function feetState(on, input) {
      if (!on) return null;
      const value = input?.value.trim() || "";
      if (value === "Unsure" || value === "") return "unsure";
      const num = Number(value);
      return num > 0 ? num : "unsure";
    }
    const quote = window.NewLeafPricing ? window.NewLeafPricing.quoteRoom({
      length: length === "Unsure" ? "unsure" : length,
      width: width === "Unsure" ? "unsure" : width,
      height: height === "Unsure" ? "unsure" : height,
      walls: paint.includes("Walls"),
      ceiling: paint.includes("Ceiling"),
      baseboardFeet: feetState(baseOn, baseInput),
      casingFeet: feetState(casingOn, casingInput),
      doorSlabs: paint.includes("Door slabs"),
      largeOpenings: !!room.querySelector('input[name="room-' + n + '-large-openings"]')?.checked
    }) : { status: "empty", customerText: "", breakdown: "", total: null };
    room.dataset.priceStatus = quote.status;
    room.dataset.priceTotal = quote.total == null ? "" : String(quote.total);
    const priceCustomer = field(room, "room-" + n + "-price-customer");
    const priceBreakdown = field(room, "room-" + n + "-price-breakdown");
    if (priceCustomer) priceCustomer.value = quote.customerText || "";
    if (priceBreakdown) priceBreakdown.value = quote.breakdown || "";
    const priceVisible = room.querySelector(".room-price");
    if (priceVisible) priceVisible.textContent = quote.customerText || "";
    const includes = room.querySelector(".room-includes");
    if (includes) includes.hidden = !quote.customerText;

    const type = field(room, "room-" + n + "-type")?.value || "";
    const windows = field(room, "room-" + n + "-windows")?.value || "0";
    const doors = field(room, "room-" + n + "-doors")?.value || "0";
    const summary = [
      "Type: " + (type || "not chosen"),
      "Length: " + (field(room, "room-" + n + "-length")?.value || "blank"),
      "Width: " + (field(room, "room-" + n + "-width")?.value || "blank"),
      "Ceiling height: " + (field(room, "room-" + n + "-ceiling-height")?.value || "blank"),
      "Windows: " + windows,
      "Doors: " + doors,
      "Paint: " + (paint.length ? paint.join(", ") : "not selected"),
      "Large openings or cabinets: " + (room.querySelector('input[name="room-' + n + '-large-openings"]')?.checked ? "Yes — review photos; wall area was not reduced" : "No"),
      "Gross wall area: " + (wallInput?.value || ""),
      "Ceiling area: " + (ceilInput?.value || ""),
      "Closet area: " + closetText,
      "Baseboard feet: " + (baseOn ? (baseInput?.value || "blank") : "not selected"),
      "Casing feet: " + (casingOn ? (casingInput?.value || "blank") : "not selected"),
      quote.customerText,
      quote.breakdown
    ].join("\n");
    const summaryInput = field(room, "room-" + n + "-summary");
    if (summaryInput) summaryInput.value = summary;
    const visible = room.querySelector(".room-math");
    if (visible) {
      visible.textContent = "Gross wall area " + (wallInput?.value || "") + ". Ceiling area " + (ceilInput?.value || "") + ". Closet: " + closetText + ".";
    }
    updateTotal();
    updateSize();
  }

  function updateTotal() {
    const el = document.getElementById("estimate-total");
    if (!el || !window.NewLeafPricing) return;
    let sum = 0;
    let priced = 0;
    let waiting = 0;
    rooms.forEach((room) => {
      if (room.hidden) return;
      if (room.dataset.priceStatus === "priced") {
        sum += Number(room.dataset.priceTotal);
        priced += 1;
      } else if (room.dataset.priceStatus === "confirm" || room.dataset.priceStatus === "review") {
        waiting += 1;
      }
    });
    const parts = [];
    if (priced) parts.push("Estimated total: " + window.NewLeafPricing.money(sum) + ". Pending photo review.");
    if (waiting) parts.push("Mike will confirm any room marked that way.");
    el.textContent = parts.join(" ");
  }

  function updateSize() {
    let files = 0;
    form.querySelectorAll(".room:not([hidden]) input[type='file']").forEach((input) => {
      if (input.files && input.files[0]) files += 1;
    });
    if (sizeNote) sizeNote.textContent = files
      ? files + " photo" + (files === 1 ? "" : "s") + " selected. They are resized on this phone before sending so the request stays under Netlify’s 8 MB limit."
      : "Add room photos from your camera or photo library.";
  }

  async function compress(file) {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch (err) {
      if (file.size <= 500 * 1024) return file;
      throw new Error("One photo could not be resized. Choose a JPEG from your library, or take the photo again.");
    }
    const maxW = 1400;
    const scale = Math.min(1, maxW / bitmap.width);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    let quality = 0.72;
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    while (blob && blob.size > 420 * 1024 && quality > 0.42) {
      quality -= 0.08;
      blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    }
    const name = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  }

  function showWholeHouse() {
    const panel = document.getElementById("whole-house-choices");
    if (panel) panel.hidden = false;
    document.getElementById("add-room")?.classList.add("is-prominent");
    const note = document.getElementById("add-room-note");
    if (note) note.hidden = false;
  }
  document.getElementById("whole-add-rooms")?.addEventListener("click", () => {
    const panel = document.getElementById("whole-house-choices");
    if (panel) panel.hidden = true;
    const add = document.getElementById("add-room");
    add?.classList.add("is-prominent");
    const note = document.getElementById("add-room-note");
    if (note) note.hidden = false;
    add?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  const params = new URLSearchParams(location.search);
  const incomingRoom = params.get("room");
  const incomingSqft = params.get("sqft");
  const whole = params.get("whole") === "1" || incomingRoom === "Whole House";
  const ballparkRoom = form.querySelector('[name="ballpark-room"]');
  const ballparkArea = form.querySelector('[name="ballpark-floor-area"]');
  if (whole) {
    if (ballparkRoom) ballparkRoom.value = "Whole House";
    showWholeHouse();
  } else if (incomingRoom) {
    if (ballparkRoom) ballparkRoom.value = incomingRoom;
    const match = rooms[0].querySelector('[data-room-type="' + incomingRoom + '"]');
    if (match) match.click();
  }
  if (!whole && incomingSqft && ballparkArea) {
    ballparkArea.value = incomingSqft + " sq ft";
    const note = document.getElementById("ballpark-carry");
    if (note) {
      note.hidden = false;
      note.textContent = "From your ballpark quote: " + (incomingRoom || "room") + ", " + incomingSqft + " sq ft of floor area.";
    }
  }
  rooms.forEach(updateRoom);
  refreshAdd();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    const active = rooms.filter((room) => !room.hidden);
    for (const room of active) {
      const n = room.dataset.room;
      updateRoom(room);
      if (!field(room, "room-" + n + "-type")?.value) {
        error.textContent = "Choose a room type for room " + n + ".";
        room.scrollIntoView({ behavior: "smooth" });
        return;
      }
      const photos = Array.from(room.querySelectorAll('input[type="file"]')).filter((input) => input.files && input.files[0]);
      if (!photos.length) {
        error.textContent = "Add at least one photo for room " + n + ".";
        room.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    if (!form.reportValidity()) return;

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Sending…";
    try {
      const data = new FormData();
      data.append("form-name", "photo-estimate");
      for (const el of form.elements) {
        if (!el.name || el.disabled || el.type === "file" || el.type === "submit" || el.type === "button") continue;
        if ((el.type === "checkbox" || el.type === "radio") && !el.checked) continue;
        if (el.name === "bot-field") continue;
        data.append(el.name, el.value);
      }
      const bot = form.querySelector('[name="bot-field"]');
      if (bot) data.append("bot-field", bot.value);
      let total = 0;
      const files = Array.from(form.querySelectorAll('.room:not([hidden]) input[type="file"]')).filter((input) => input.files && input.files[0]);
      for (const input of files) {
        const compressed = await compress(input.files[0]);
        total += compressed.size;
        if (total > MAX_BYTES) {
          throw new Error("These photos are still over the 8 MB limit after resizing. Remove a photo and try again.");
        }
        data.append(input.name, compressed, compressed.name);
      }
      const response = await fetch("/", { method: "POST", body: data });
      if (!response.ok) throw new Error("The estimate could not be sent (status " + response.status + "). Please call (207) 468-5509.");
      window.location.href = "photo-estimate-thanks.html";
    } catch (err) {
      error.textContent = err.message || "The estimate could not be sent. Please call (207) 468-5509.";
      submit.disabled = false;
      submit.textContent = "Send my photo estimate";
    }
  });
})();
