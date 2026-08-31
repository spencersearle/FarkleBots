import { farkleChance, expectedValueOfRolling } from "../Frontend/engine/odds";
import type { StrategyId } from "./types";

export interface DecisionContext {
  pot: number;
  diceLeft: number;
  banked: number;
  leaderScore: number;
  target: number;
  turnNumber: number;
}

export interface Decision {
  roll: boolean;
  reasoning: string;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const GREEDY_CEILING = 0.35;
const SAFE_FLOOR = 300;

export class RollingStrategy {
  private strategyId: StrategyId;

  constructor(strategyId: StrategyId) {
    this.strategyId = strategyId;
  }

  public decide(ctx: DecisionContext): Decision {
    switch (this.strategyId) {
      case "human":
        return { roll: false, reasoning: "Waiting on you." };

      case "greedy": {
        const p = farkleChance(ctx.diceLeft);
        const roll = p < GREEDY_CEILING;
        return {
          roll,
          reasoning: roll
            ? `${ctx.diceLeft} dice left and ${pct(p)} to lose it. Under my ${pct(GREEDY_CEILING)} ceiling, so I roll.`
            : `${pct(p)} chance of losing ${ctx.pot} is past my ceiling. Banking.`,
        };
      }

      case "safe": {
        const roll = ctx.pot < SAFE_FLOOR;
        return {
          roll,
          reasoning: roll
            ? `Only ${ctx.pot} so far, under my ${SAFE_FLOOR} floor. Worth one more with ${ctx.diceLeft}.`
            : `${ctx.pot} is enough. I do not need to find out what happens next.`,
        };
      }

      case "greedierOverTime": {
        const ceiling = Math.min(0.1 + ctx.turnNumber * 0.02, 0.6);
        const p = farkleChance(ctx.diceLeft);
        const roll = p < ceiling;
        return {
          roll,
          reasoning: roll
            ? `Turn ${ctx.turnNumber}, so my ceiling is up to ${pct(ceiling)}. ${pct(p)} risk is fine.`
            : `Even at turn ${ctx.turnNumber} my ceiling is ${pct(ceiling)} and this is ${pct(p)}. Banking ${ctx.pot}.`,
        };
      }

      case "safeWhenAhead": {
        const ahead = ctx.banked >= ctx.leaderScore;
        const ceiling = ahead ? 0.2 : 0.45;
        const p = farkleChance(ctx.diceLeft);
        const roll = p < ceiling;
        return {
          roll,
          reasoning: ahead
            ? roll
              ? `I am ahead, so I only take small risks. ${pct(p)} is small enough.`
              : `I am ahead by ${ctx.banked - ctx.leaderScore + 1}. No reason to risk ${ctx.pot}. Banking.`
            : roll
              ? `Behind by ${ctx.leaderScore - ctx.banked}. I have to take ${pct(p)} to catch up.`
              : `Behind, but ${pct(p)} would probably cost me the ${ctx.pot} I have. Banking.`,
        };
      }

      case "neverRollsOne": {
        if (ctx.diceLeft <= 1) {
          return {
            roll: false,
            reasoning: `One die is a ${pct(farkleChance(1))} coin flip against me. I never take it.`,
          };
        }
        const worth = expectedValueOfRolling(ctx.pot, ctx.diceLeft) > ctx.pot;
        return {
          roll: worth,
          reasoning: worth
            ? `${ctx.diceLeft} dice is a fair throw. Rolling.`
            : `${ctx.diceLeft} dice no longer pays. Banking ${ctx.pot}.`,
        };
      }

      default:
        return { roll: false, reasoning: "Unknown strategy." };
    }
  }
}
