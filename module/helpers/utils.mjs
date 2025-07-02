// Utility functions for the myrpg system

/**
 * Convert a numeric ability value to a rank and appropriate die size.
 * @param {number} [val=0] The ability value.
 * @returns {{rank: number, die: number}}
 */
export function getRankAndDie(val = 0) {
  const rank = Math.max(1, Math.floor((val - 1) / 4) + 1);
  const die = [6, 8, 10, 12, 14][rank - 1] || 4;
  return { rank, die };
}

/**
 * Determine a simplified rank (1-5) based on a value in steps of two.
 * Used purely for coloring cells in the UI.
 * @param {number} [val=0] The value to rank.
 * @returns {number} Rank between 1 and 5
 */
export function getColorRank(val = 0) {
  if (val <= 2) return 1;
  if (val <= 4) return 2;
  if (val <= 6) return 3;
  if (val <= 8) return 4;
  return 5;
}
