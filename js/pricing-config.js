/* Interior painting rates for the homepage rough range, the pricing page,
   and the photo estimate. Customers see the combined paint-included rate only.
   Mike's submission shows labor and paint separately.

   PLACEHOLDER SPLITS: Mike has not provided a labor-versus-paint split.
   The pairs below are placeholders that sum to Phillip's proposed customer rates.
   Change the two parts together so each pair still sums to the published rate.
   Walls 1.40 + 0.65 = 2.05 per sq ft
   Ceiling 1.45 + 0.80 = 2.25 per sq ft
   Baseboards 2.90 + 1.30 = 4.20 per linear foot
   Casing 2.90 + 1.30 = 4.20 per linear foot */
const NEW_LEAF_PRICING = {
  /* Homepage slider assumes a square room and this ceiling height.
     side = square root of floor area
     gross wall area = 2 × (side + side) × assumedCeilingHeightFt */
  assumedCeilingHeightFt: 8,
  floorAreaSqFt: { min: 40, max: 3000, step: 10, start: 150 },
  walls: { laborPerSqFt: 1.4, paintPerSqFt: 0.65 },
  ceiling: { laborPerSqFt: 1.45, paintPerSqFt: 0.8 },
  baseboard: { laborPerLf: 2.9, paintPerLf: 1.3 },
  casing: { laborPerLf: 2.9, paintPerLf: 1.3 }
};

if (typeof module !== "undefined" && module.exports) module.exports = NEW_LEAF_PRICING;
if (typeof window !== "undefined") window.NEW_LEAF_PRICING = NEW_LEAF_PRICING;
