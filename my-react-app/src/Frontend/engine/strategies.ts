/**
 * The rolling policies from the whiteboard.
 *
 * A policy answers exactly one question: given the table, roll again or bank?
 * It returns its answer and a sentence explaining itself, because showing the
 * reasoning is the point of this project.
 */

import { farkleChance, expectedValueOfRolling } from './odds';
import type { StrategyId } from '../types';

export interface DecisionContext {
  /** Unbanked points held this turn. */
  pot: number;
  /** How many dice would be thrown if the seat rolls again. */
  diceLeft: number;
  /** Points this seat has already banked. */
  banked: number;
  /** Highest banked score at the table, this seat included. */
  leaderScore: number;
  /** Score needed to win. */
  target: number;
  /** 1-based turn counter for the whole game. */
  turnNumber: number;
}

export interface Decision {
  roll: boolean;
  reasoning: string;
}

export interface Strategy {
  id: StrategyId;
  label: string;
  blurb: string;
  decide(ctx: DecisionContext): Decision;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/** Rolls while the chance of losing everything stays under a fixed ceiling. */
const GREEDY_CEILING = 0.35;
/** Banks as soon as the turn is worth this much. */
const SAFE_FLOOR = 300;

export const STRATEGIES: Record<StrategyId, Strategy> = {
  human: {
    id: 'human',
    label: 'Human player',
    blurb: 'You choose which dice to keep and when to bank.',
    decide: () => ({ roll: false, reasoning: 'Waiting on you.' }),
  },

  greedy: {
    id: 'greedy',
    label: 'Risky, greedy',
    blurb: 'Keeps rolling while the bust chance stays under 35 percent.',
    decide: ({ pot, diceLeft }) => {
      const p = farkleChance(diceLeft);
      const roll = p < GREEDY_CEILING;
      return {
        roll,
        reasoning: roll
          ? `${diceLeft} dice left and ${pct(p)} to lose it. Under my ${pct(GREEDY_CEILING)} ceiling, so I roll.`
          : `${pct(p)} chance of losing ${pot} is past my ceiling. Banking.`,
      };
    },
  },

  safe: {
    id: 'safe',
    label: 'Plays it safe',
    blurb: 'Banks as soon as the turn is worth 300 or more.',
    decide: ({ pot, diceLeft }) => {
      const roll = pot < SAFE_FLOOR;
      return {
        roll,
        reasoning: roll
          ? `Only ${pot} so far, under my ${SAFE_FLOOR} floor. Worth one more with ${diceLeft}.`
          : `${pot} is enough. I do not need to find out what happens next.`,
      };
    },
  },

  greedierOverTime: {
    id: 'greedierOverTime',
    label: 'Greedier over time',
    blurb: 'Starts careful and raises its risk ceiling every turn.',
    decide: ({ pot, diceLeft, turnNumber }) => {
      const ceiling = Math.min(0.1 + turnNumber * 0.02, 0.6);
      const p = farkleChance(diceLeft);
      const roll = p < ceiling;
      return {
        roll,
        reasoning: roll
          ? `Turn ${turnNumber}, so my ceiling is up to ${pct(ceiling)}. ${pct(p)} risk is fine.`
          : `Even at turn ${turnNumber} my ceiling is ${pct(ceiling)} and this is ${pct(p)}. Banking ${pot}.`,
      };
    },
  },

  safeWhenAhead: {
    id: 'safeWhenAhead',
    label: 'Safe when ahead',
    blurb: 'Plays it safe in the lead, gets greedy when behind.',
    decide: ({ pot, diceLeft, banked, leaderScore }) => {
      const ahead = banked >= leaderScore;
      const ceiling = ahead ? 0.2 : 0.45;
      const p = farkleChance(diceLeft);
      const roll = p < ceiling;
      return {
        roll,
        reasoning: ahead
          ? roll
            ? `I am ahead, so I only take small risks. ${pct(p)} is small enough.`
            : `I am ahead by ${banked - leaderScore + 1}. No reason to risk ${pot}. Banking.`
          : roll
            ? `Behind by ${leaderScore - banked}. I have to take ${pct(p)} to catch up.`
            : `Behind, but ${pct(p)} would probably cost me the ${pot} I have. Banking.`,
      };
    },
  },

  neverRollsOne: {
    id: 'neverRollsOne',
    label: 'Never rolls one die',
    blurb: 'Will not throw a lone die, whatever the pot is worth.',
    decide: ({ pot, diceLeft }) => {
      if (diceLeft <= 1) {
        return { roll: false, reasoning: `One die is a ${pct(farkleChance(1))} coin flip against me. I never take it.` };
      }
      const worth = expectedValueOfRolling(pot, diceLeft) > pot;
      return {
        roll: worth,
        reasoning: worth
          ? `${diceLeft} dice is a fair throw. Rolling.`
          : `${diceLeft} dice no longer pays. Banking ${pot}.`,
      };
    },
  },
};

export const BOT_STRATEGY_IDS: StrategyId[] = [
  'greedy',
  'safe',
  'greedierOverTime',
  'safeWhenAhead',
  'neverRollsOne',
];
