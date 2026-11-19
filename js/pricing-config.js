/* Ballpark interior-painting rates for the homepage quote.
   Mike: these are the only numbers the quote will use.
   Enter US dollars per square foot of floor area.
   low and high become "Estimated Price: $X – $Y" (rate × floor area).
   Leave a value null until you are ready to publish it.
   If low or high is null, that room type shows no dollar amount. */
window.NEW_LEAF_PRICING = {
  floorAreaSqFt: {
    min: 40,
    max: 3000,
    step: 10,
    start: 150
  },
  ratesPerSqFt: {
    bedroom: { low: null, high: null },
    livingRoom: { low: null, high: null },
    kitchen: { low: null, high: null },
    wholeHouse: { low: null, high: null }
  }
};
