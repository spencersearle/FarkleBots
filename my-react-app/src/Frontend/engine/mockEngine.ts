/**
 * A complete, playable Farkle game living entirely in the frontend.
 *
 * This exists so the UI can be built, demoed and debugged before the Backend/
 * classes have any methods on them. It is deliberately the ONLY place the
 * frontend simulates rules: every component reads a GameSnapshot and knows
 * nothing about where it came from. When Tony's engine is ready, adapter.ts
 * produces the same snapshot shape and this file can be dropped or kept as a
 * fixture for testing.
 */

import { scoreAll, scoreSelection, rollDice, isFarkle } from '../../Backend/farkleRules';
import { farkleChance, expectedValueOfRolling } from "./odds";
import { STRATEGIES } from "./strategies";
import type {
  GameSnapshot,
  SeatView,
  DieView,
  LogEntry,
  Phase,
  SeatConfig,
  TurnRecord,
  DecisionMath,
} from "../types";

const DICE_COUNT = 6;

interface Seat extends SeatConfig {
  banked: number;
  history: TurnRecord[];
  isHuman: boolean;
}

interface Die {
  id: string;
  value: number;
  locked: boolean;
  selected: boolean;
}

export class FarkleGame {
  private seats: Seat[];
  private dice: Die[];
  private active = 0;
  private turnPot = 0;
  private turnPeak = 0;
  private turnNumber = 1;
  private phase: Phase = "awaitingRoll";
  private log: LogEntry[] = [];
  private logId = 0;
  private winnerId: string | null = null;

  readonly target: number;
  private readonly rng: () => number;

  constructor(
    configs: SeatConfig[],
    target: number,
    rng: () => number = Math.random,
  ) {
    this.target = target;
    this.rng = rng;
    this.seats = configs.map((c) => ({
      ...c,
      banked: 0,
      history: [],
      isHuman: c.strategy === "human",
    }));
    this.dice = Array.from({ length: DICE_COUNT }, (_, i) => ({
      id: `d${i}`,
      value: 1,
      locked: false,
      selected: false,
    }));
  }

  // ---------------------------------------------------------------- queries

  get currentSeat(): Seat {
    return this.seats[this.active];
  }
  get isOver(): boolean {
    return this.winnerId !== null;
  }
  /** True when the table is waiting on a person rather than a policy. */
  get awaitingHuman(): boolean {
    return (
      this.currentSeat.isHuman &&
      (this.phase === "awaitingRoll" ||
        this.phase === "awaitingPick" ||
        this.phase === "awaitingDecision")
    );
  }

  private get liveDice(): Die[] {
    return this.dice.filter((d) => !d.locked);
  }
  private get selectedDice(): Die[] {
    return this.dice.filter((d) => d.selected);
  }
  private get pendingPick(): number {
    return scoreSelection(this.selectedDice.map((d) => d.value));
  }
  private get leaderScore(): number {
    return Math.max(...this.seats.map((s) => s.banked));
  }

  // ---------------------------------------------------------------- actions

  /** Throw every die that is not locked. */
  roll(): void {
    if (this.phase !== "awaitingRoll" || this.isOver) return;
    const live = this.liveDice;
    const values = rollDice(live.length, this.rng);
    live.forEach((d, i) => {
      d.value = values[i];
      d.selected = false;
    });

    this.push("roll", `${this.currentSeat.name} rolls ${live.length}`);

    if (isFarkle(values)) {
      this.phase = "farkle";
      this.push(
        "farkle",
        `${this.currentSeat.name} farkled and lost ${this.turnPot}`,
      );
    } else {
      this.phase = "awaitingPick";
    }
  }

  /** Toggle one die into or out of the current pick. Locked dice ignore this. */
  toggleDie(id: string): void {
    if (this.phase !== "awaitingPick" && this.phase !== "awaitingDecision")
      return;
    const die = this.dice.find((d) => d.id === id);
    if (!die || die.locked) return;
    die.selected = !die.selected;
    this.phase = this.pendingPick > 0 ? "awaitingDecision" : "awaitingPick";
  }

  /**
   * Pick every die that scores.
   *
   * Bots always take the whole scoring set. A sharper player sometimes keeps
   * fewer dice to leave more on the table; modelling that is a strategy
   * refinement rather than a rules question, so it lives here as a known
   * simplification.
   */
  autoPick(): void {
    if (this.phase !== "awaitingPick") return;
    const live = this.liveDice;
    const { scoringIndexes } = scoreAll(live.map((d) => d.value));
    if (scoringIndexes.length === 0) return;
    live.forEach((d, i) => {
      d.selected = scoringIndexes.includes(i);
    });
    const kept = this.selectedDice.map((d) => d.value).join(" · ");
    this.push(
      "keep",
      `${this.currentSeat.name} keeps ${kept} for ${this.pendingPick}`,
    );
    this.phase = "awaitingDecision";
  }

  /** Commit the pick, then throw whatever is left. Handles hot dice. */
  rollAgain(): void {
    if (this.phase !== "awaitingDecision") return;
    this.commitPick();
    if (this.liveDice.length === 0) {
      this.dice.forEach((d) => {
        d.locked = false;
        d.selected = false;
      });
      this.phase = "hotDice";
      this.push(
        "hotDice",
        `${this.currentSeat.name} scored all six, dice come back`,
      );
      return;
    }
    this.phase = "awaitingRoll";
  }

  /** Commit the pick and add the turn to this seat's banked score. */
  bank(): void {
    if (this.phase !== "awaitingDecision") return;
    this.commitPick();
    const seat = this.currentSeat;
    seat.banked += this.turnPot;
    seat.history.push({ peak: this.turnPeak, busted: false });
    this.push("bank", `${seat.name} banked ${this.turnPot}`);

    if (seat.banked >= this.target) {
      this.winnerId = seat.id;
      this.phase = "gameOver";
      this.push("win", `${seat.name} reached ${seat.banked} and wins`);
      return;
    }
    this.nextSeat();
  }

  /** Move play on after a farkle or a hot-dice pause. */
  advance(): void {
    if (this.phase === "hotDice") {
      this.phase = "awaitingRoll";
      return;
    }
    if (this.phase !== "farkle") return;
    const seat = this.currentSeat;
    seat.history.push({ peak: this.turnPeak, busted: true });
    this.nextSeat();
  }

  /** Run one step of the active bot's turn. Returns false when it is a human's. */
  stepBot(): boolean {
    if (this.isOver || this.currentSeat.isHuman) return false;
    switch (this.phase) {
      case "awaitingRoll":
        this.roll();
        return true;
      case "awaitingPick":
        this.autoPick();
        return true;
      case "awaitingDecision": {
        if (this.decideAsBot()) this.rollAgain();
        else this.bank();
        return true;
      }
      case "farkle":
      case "hotDice":
        this.advance();
        return true;
      default:
        return false;
    }
  }

  // ---------------------------------------------------------------- internals

  private decideAsBot(): boolean {
    const seat = this.currentSeat;
    const wouldRemain = this.liveDice.length - this.selectedDice.length;
    const diceLeft = wouldRemain === 0 ? DICE_COUNT : wouldRemain;
    return STRATEGIES[seat.strategy].decide({
      pot: this.turnPot + this.pendingPick,
      diceLeft,
      banked: seat.banked,
      leaderScore: this.leaderScore,
      target: this.target,
      turnNumber: this.turnNumber,
    }).roll;
  }

  private commitPick(): void {
    this.turnPot += this.pendingPick;
    this.turnPeak = Math.max(this.turnPeak, this.turnPot);
    this.dice.forEach((d) => {
      if (d.selected) {
        d.locked = true;
        d.selected = false;
      }
    });
  }

  private nextSeat(): void {
    this.turnPot = 0;
    this.turnPeak = 0;
    this.dice.forEach((d) => {
      d.locked = false;
      d.selected = false;
      d.value = 1;
    });
    this.active = (this.active + 1) % this.seats.length;
    if (this.active === 0) this.turnNumber += 1;
    this.phase = "awaitingRoll";
  }

  private push(kind: LogEntry["kind"], text: string): void {
    this.logId += 1;
    this.log.unshift({
      id: `l${this.logId}`,
      seatId: this.currentSeat.id,
      accent: this.currentSeat.accent,
      text,
      kind,
    });
    if (this.log.length > 40) this.log.pop();
  }

  // ---------------------------------------------------------------- snapshot

  snapshot(): GameSnapshot {
    const liveValues = this.liveDice.map((d) => d.value);
    const scoring =
      this.phase === "awaitingPick" || this.phase === "awaitingDecision"
        ? scoreAll(liveValues).scoringIndexes
        : [];
    let liveIndex = -1;

    const dice: DieView[] = this.dice.map((d) => {
      if (!d.locked) liveIndex += 1;
      return {
        id: d.id,
        value: d.value,
        locked: d.locked,
        selected: d.selected,
        scoring: !d.locked && scoring.includes(liveIndex),
      };
    });

    const seats: SeatView[] = this.seats.map((s, i) => {
      const turns = s.history.length;
      const busts = s.history.filter((t) => t.busted).length;
      const scored = s.history.filter((t) => !t.busted);
      return {
        id: s.id,
        name: s.name,
        strategy: s.strategy,
        strategyLabel: STRATEGIES[s.strategy].label,
        isHuman: s.isHuman,
        banked: s.banked,
        isActive: i === this.active && !this.isOver,
        accent: s.accent,
        history: s.history,
        avgTurn:
          turns === 0 ? 0 : Math.round(s.banked / Math.max(scored.length, 1)),
        farkleRate: turns === 0 ? 0 : busts / turns,
        timesBanked: scored.length,
      };
    });

    return {
      seats,
      dice,
      turnPot: this.turnPot,
      pendingPick: this.pendingPick,
      targetScore: this.target,
      turnNumber: this.turnNumber,
      phase: this.phase,
      log: this.log,
      math: this.buildMath(),
      winner: seats.find((s) => s.id === this.winnerId) ?? null,
    };
  }

  private buildMath(): DecisionMath | null {
    const seat = this.currentSeat;
    const pot = this.turnPot + this.pendingPick;

    if (this.phase === "farkle") {
      return {
        diceLeft: 0,
        farkleChance: 1,
        expectedIfRoll: 0,
        certainIfBank: 0,
        verdict: "BUST",
        reasoning: `A roll with no scoring dice ends the turn. ${this.turnPot} gone.`,
      };
    }
    if (this.phase === "hotDice") {
      return {
        diceLeft: DICE_COUNT,
        farkleChance: farkleChance(DICE_COUNT),
        expectedIfRoll: expectedValueOfRolling(pot, DICE_COUNT),
        certainIfBank: pot,
        verdict: "HOT",
        reasoning:
          "All six dice scored, so the pot carries and all six come back live.",
      };
    }
    if (this.phase !== "awaitingDecision") return null;

    const wouldRemain = this.liveDice.length - this.selectedDice.length;
    const diceLeft = wouldRemain === 0 ? DICE_COUNT : wouldRemain;
    const decision = STRATEGIES[seat.strategy].decide({
      pot,
      diceLeft,
      banked: seat.banked,
      leaderScore: this.leaderScore,
      target: this.target,
      turnNumber: this.turnNumber,
    });

    return {
      diceLeft,
      farkleChance: farkleChance(diceLeft),
      expectedIfRoll: Math.round(expectedValueOfRolling(pot, diceLeft)),
      certainIfBank: pot,
      verdict: decision.roll ? "ROLL" : "BANK",
      reasoning: seat.isHuman
        ? `${diceLeft} dice, ${pot} on the table. Rolling is worth about ${Math.round(expectedValueOfRolling(pot, diceLeft))}.`
        : decision.reasoning,
    };
  }
}
