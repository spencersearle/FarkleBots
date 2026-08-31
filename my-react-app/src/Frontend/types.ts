/**
 * The view model the whole UI renders from.
 *
 * Nothing in here is a class. The Backend/ classes are mutable, and React will
 * not re-render when a mutable instance changes in place, so the UI never reads
 * them directly. `engine/adapter.ts` converts a Backend `Game` into one of these
 * plain snapshots and the UI reads only that.
 */

export type StrategyId =
  | 'human'
  | 'greedy'
  | 'safe'
  | 'greedierOverTime'
  | 'safeWhenAhead'
  | 'neverRollsOne';

export type AccentId = 'greedy' | 'cautious' | 'adaptive' | 'human' | 'extra';

/** What the table is doing right now. Drives which controls and overlays show. */
export type Phase =
  | 'awaitingRoll'      // seat is up, dice not yet thrown
  | 'awaitingPick'      // dice are showing, scoring dice not yet chosen
  | 'awaitingDecision'  // dice picked, bank-or-roll is the open question
  | 'farkle'            // the roll scored nothing, pot is lost
  | 'hotDice'           // all six scored, dice come back
  | 'gameOver';

export interface DieView {
  id: string;
  value: number;
  /** Set aside in an earlier roll this turn. Cannot be unpicked. */
  locked: boolean;
  /** Picked during this roll, still releasable. */
  selected: boolean;
  /** Part of some scoring combination in the current roll. */
  scoring: boolean;
}

/** One completed turn, for the turn tape. */
export interface TurnRecord {
  /** Points that were on the table at the turn's peak. */
  peak: number;
  /** True if the turn ended in a farkle and the peak was lost. */
  busted: boolean;
}

export interface SeatView {
  id: string;
  name: string;
  strategy: StrategyId;
  strategyLabel: string;
  isHuman: boolean;
  banked: number;
  isActive: boolean;
  accent: AccentId;
  history: TurnRecord[];
  /** Derived stats, recomputed from history. */
  avgTurn: number;
  farkleRate: number;
  timesBanked: number;
}

export interface LogEntry {
  id: string;
  seatId: string;
  accent: AccentId;
  text: string;
  kind: 'roll' | 'keep' | 'bank' | 'farkle' | 'hotDice' | 'win';
}

/** The numbers behind the decision the current seat is facing. */
export interface DecisionMath {
  diceLeft: number;
  farkleChance: number;
  expectedIfRoll: number;
  certainIfBank: number;
  verdict: 'ROLL' | 'BANK' | 'BUST' | 'HOT';
  reasoning: string;
}

export interface GameSnapshot {
  seats: SeatView[];
  dice: DieView[];
  turnPot: number;
  /** Points from dice picked during the current roll, not yet committed. */
  pendingPick: number;
  targetScore: number;
  turnNumber: number;
  phase: Phase;
  log: LogEntry[];
  math: DecisionMath | null;
  winner: SeatView | null;
}

export interface SeatConfig {
  id: string;
  name: string;
  strategy: StrategyId;
  accent: AccentId;
}
