// Utility functions for the myrpg system

/**
 * Convert a numeric ability value to a rank and appropriate die size.
 * @param {number} [val=0] The ability value.
 * @returns {{rank: number, die: number}}
 */
export function getRankAndDie(val = 0) {
  const rank = Math.max(1, Math.floor((val - 1) / 4) + 1); // ranks 1..5
  const dice = [4, 6, 8, 10, 12];
  const die = dice[rank - 1] || dice[0];
  return { rank, die };
}
