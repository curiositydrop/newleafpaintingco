const assert = require("assert");
const pricing = require("./pricing.js");

const wallsOnly = pricing.quoteRoom({
  length: 12, width: 12, height: 8,
  walls: true, ceiling: false,
  baseboardFeet: null, casingFeet: null
});
assert.strictEqual(wallsOnly.status, "priced");
assert.strictEqual(wallsOnly.total.toFixed(2), "787.20");

const withCeiling = pricing.quoteRoom({
  length: 12, width: 12, height: 8,
  walls: true, ceiling: true,
  baseboardFeet: null, casingFeet: null
});
assert.strictEqual(withCeiling.total.toFixed(2), "1111.20");

const withBase = pricing.quoteRoom({
  length: 12, width: 12, height: 8,
  walls: true, ceiling: true,
  baseboardFeet: 45, casingFeet: null
});
assert.strictEqual(withBase.total.toFixed(2), "1300.20");

const unsure = pricing.quoteRoom({
  length: "unsure", width: 12, height: 8,
  walls: true, ceiling: false,
  baseboardFeet: null, casingFeet: null
});
assert.strictEqual(unsure.status, "confirm");
assert.strictEqual(unsure.customerText, "Mike will confirm");

const trimOnly = pricing.quoteRoom({
  length: 12, width: 12, height: 8,
  walls: false, ceiling: false,
  baseboardFeet: 45, casingFeet: null
});
assert.strictEqual(trimOnly.status, "review");
assert.strictEqual(trimOnly.total, null);

const rough = pricing.roughRange(144);
assert.strictEqual(rough.height, 8);
assert.ok(rough.low < rough.high);
assert.strictEqual(rough.low.toFixed(2), "787.20");
assert.strictEqual(rough.high.toFixed(2), "1111.20");

console.log("pricing.test.js passed");
console.log("walls only", wallsOnly.total.toFixed(2));
console.log("walls + ceiling", withCeiling.total.toFixed(2));
console.log("plus 45 lf baseboard", withBase.total.toFixed(2));
console.log("12x12 rough range", rough.low.toFixed(2), rough.high.toFixed(2));
