/**
 * Probability and expected value.
 *
 * CLAIRE: this file is the seam for your work. Everything else in the frontend
 * calls these four functions and does not care how they are computed. Right now
 * FARKLE_CHANCE is the standard closed-form table and EXPECTED_GAIN is a
 * simulation estimate. Replace either with your own numbers and the UI, the
 * strategies and the displayed decision math all follow automatically.
 */

/**
 * Probability that a roll of n dice contains no scoring die at all.
 * Exact values: (non-scoring outcomes) / 6^n.
 */
export const FARKLE_CHANCE: Record<number, number> = {
  1: 0.6667, // 4/6
  2: 0.4444, // 16/36
  3: 0.2778, // 60/216
  4: 0.1574, // 204/1296
  5: 0.0772, // 600/7776
  6: 0.0231, // 1080/46656
};

/**
 * Average points added by a roll of n dice, given that the roll scores at all.
 * Estimated by simulation over the rule set in rules.ts.
 */
export const EXPECTED_GAIN: Record<number, number> = {
  1: 75,
  2: 135,
  3: 205,
  4: 290,
  5: 400,
  6: 560,
};

export function farkleChance(diceLeft: number): number {
  return FARKLE_CHANCE[diceLeft] ?? 0;
}

/**
 * Expected value of rolling `diceLeft` dice while holding `pot` unbanked points.
 *
 * On a farkle the pot is lost, so the whole term drops to zero. Otherwise you
 * keep the pot and add the average gain. This deliberately looks only one roll
 * ahead: a full treatment would recurse over whether you would then roll again.
 */
export function expectedValueOfRolling(pot: number, diceLeft: number): number {
  const p = farkleChance(diceLeft);
  return (1 - p) * (pot + (EXPECTED_GAIN[diceLeft] ?? 0));
}

/** Rolling is worth it when it beats simply banking what you already hold. */
export function rollingBeatsBanking(pot: number, diceLeft: number): boolean {
  return expectedValueOfRolling(pot, diceLeft) > pot;
}
