/* Room estimate math. Customer totals use the combined rate.
   Breakdown lines keep the placeholder labor and paint parts. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.NewLeafPricing = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  function config() {
    if (typeof window !== "undefined" && window.NEW_LEAF_PRICING) return window.NEW_LEAF_PRICING;
    return require("./pricing-config.js");
  }

  function cents(n) {
    return Math.round(n * 100) / 100;
  }

  function money(n) {
    return cents(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  function combined(part, laborKey, materialKey) {
    return cents(part[laborKey] + part[materialKey]);
  }

  function line(label, quantity, unit, laborRate, paintRate) {
    const rate = cents(laborRate + paintRate);
    const labor = cents(quantity * laborRate);
    const paint = cents(quantity * paintRate);
    const total = cents(quantity * rate);
    return { label, quantity, unit, laborRate, paintRate, rate, labor, paint, total };
  }

  function formatLine(item) {
    return item.label + ": " + item.quantity + " " + item.unit
      + " × " + money(item.rate)
      + " (" + money(item.laborRate) + " labor + " + money(item.paintRate) + " paint placeholder)"
      + " = " + money(item.total)
      + " [labor " + money(item.labor) + ", paint " + money(item.paint) + "]";
  }

  /* input: { length, width, height, walls, ceiling, baseboardFeet, casingFeet, doorSlabs, largeOpenings }
     Numbers are feet. null means not selected. "unsure" means selected but unknown. */
  function quoteRoom(input, rates) {
    const cfg = rates || config();
    const walls = !!input.walls;
    const ceiling = !!input.ceiling;
    const base = input.baseboardFeet;
    const casing = input.casingFeet;
    const trimSelected = base != null || casing != null;
    const pricedSurfaces = walls || ceiling;

    if (!pricedSurfaces && (trimSelected || input.doorSlabs)) {
      return {
        status: "review",
        total: null,
        customerText: "Mike reviews trim-only jobs before confirming a price.",
        breakdown: "Trim-only room. No automatic price.\n" + (input.doorSlabs ? "Door slabs: separate quote after photo review.\n" : "")
      };
    }
    if (!pricedSurfaces && !trimSelected && !input.doorSlabs) {
      return { status: "empty", total: null, customerText: "", breakdown: "" };
    }

    const unsure = [];
    if ((walls || ceiling || base != null) && (input.length === "unsure" || input.width === "unsure")) unsure.push("floor size");
    if (walls && input.height === "unsure") unsure.push("wall height");
    if (base === "unsure") unsure.push("baseboard length");
    if (casing === "unsure") unsure.push("casing length");
    if (unsure.length) {
      return {
        status: "confirm",
        total: null,
        customerText: "Mike will confirm",
        breakdown: "Mike will confirm. Unsure: " + unsure.join(", ") + "."
          + (input.largeOpenings ? "\nFLAG: Large openings or cabinets cover part of the walls. Review the photos." : "")
          + (input.doorSlabs ? "\nDoor slabs: separate quote after photo review." : "")
      };
    }

    const length = Number(input.length);
    const width = Number(input.width);
    const height = Number(input.height);
    const lines = [];
    if (walls) {
      if (!(length > 0) || !(width > 0) || !(height > 0)) {
        return { status: "confirm", total: null, customerText: "Mike will confirm", breakdown: "Wall dimensions are incomplete." };
      }
      const area = cents(2 * (length + width) * height);
      lines.push(line("Walls", area, "sq ft", cfg.walls.laborPerSqFt, cfg.walls.paintPerSqFt));
    }
    if (ceiling) {
      if (!(length > 0) || !(width > 0)) {
        return { status: "confirm", total: null, customerText: "Mike will confirm", breakdown: "Ceiling dimensions are incomplete." };
      }
      lines.push(line("Ceiling", cents(length * width), "sq ft", cfg.ceiling.laborPerSqFt, cfg.ceiling.paintPerSqFt));
    }
    if (typeof base === "number") {
      if (!(base > 0)) return { status: "confirm", total: null, customerText: "Mike will confirm", breakdown: "Baseboard length is incomplete." };
      lines.push(line("Baseboards", cents(base), "lf", cfg.baseboard.laborPerLf, cfg.baseboard.paintPerLf));
    }
    if (typeof casing === "number") {
      if (!(casing > 0)) return { status: "confirm", total: null, customerText: "Mike will confirm", breakdown: "Casing length is incomplete." };
      lines.push(line("Door and window casing", cents(casing), "lf", cfg.casing.laborPerLf, cfg.casing.paintPerLf));
    }

    const total = cents(lines.reduce((sum, item) => sum + item.total, 0));
    const notes = [];
    if (input.largeOpenings) notes.push("FLAG: Large openings or cabinets cover part of the walls. Gross wall area was not reduced. Review the photos.");
    if (input.doorSlabs) notes.push("Door slabs: separate quote after photo review.");
    return {
      status: "priced",
      total,
      lines,
      customerText: "Estimated total for this room: " + money(total) + ". Pending photo review."
        + (input.doorSlabs ? " Door slabs: separate quote after photo review." : ""),
      breakdown: lines.map(formatLine).concat(notes).join("\n") + "\nRoom total: " + money(total)
    };
  }

  /* Floor-area slider. Assumes a square room: side = sqrt(area).
     Low is walls only. High is walls plus a flat ceiling. */
  function roughRange(floorSqFt, rates) {
    const cfg = rates || config();
    const area = Number(floorSqFt);
    const side = Math.sqrt(area);
    const height = cfg.assumedCeilingHeightFt;
    const wallArea = 2 * (side + side) * height;
    const wallRate = combined(cfg.walls, "laborPerSqFt", "paintPerSqFt");
    const ceilingRate = combined(cfg.ceiling, "laborPerSqFt", "paintPerSqFt");
    const low = cents(wallArea * wallRate);
    const high = cents(low + area * ceilingRate);
    return { low, high, side, height, wallArea, ceilingArea: area };
  }

  return { quoteRoom, roughRange, money, cents, combined };
});
