/**
 * Bridge from the Backend Game class to the snapshot the UI renders.
 *
 * This converts mutable backend state into immutable snapshots for React.
 */

import { scoreAll } from "../../Backend/farkleRules";
import { farkleChance, expectedValueOfRolling } from "./odds";
import { STRATEGIES } from "./strategies";
import type { GameSnapshot, DieView, SeatView, LogEntry } from "../types";
import type { Game } from "../../Backend/game";

export function toSnapshot(game: Game): GameSnapshot {
  const seats: SeatView[] = game.players.map((player, index) => {
    const stats = player.getStats();
    return {
      id: player.id,
      name: player.name,
      strategy: player.strategy,
      strategyLabel: STRATEGIES[player.strategy].label,
      isHuman: player.isHuman,
      banked: player.banked,
      isActive: index === game.activePlayerIndex && !game.isOver,
      accent: player.accent,
      history: player.history,
      avgTurn: stats.avgTurn,
      farkleRate: stats.farkleRate,
      timesBanked: stats.timesBanked,
    };
  });

  // Compute which dice are scoring in the current phase
  let scoringIndexes: number[] = [];
  if (game.phase === "awaitingPick" || game.phase === "awaitingDecision") {
    const liveValues = game.allDice.getLiveDice().map((d) => d.currentValue);
    scoringIndexes = scoreAll(liveValues).scoringIndexes;
  }

  // Map live dice to their visual representation
  let liveIndex = -1;
  const dice: DieView[] = game.allDice.allDice.map((d) => {
    if (!d.isFrozen) liveIndex += 1;
    return {
      id: d.id,
      value: d.currentValue,
      locked: d.isFrozen,
      selected: d.selected,
      scoring: !d.isFrozen && scoringIndexes.includes(liveIndex),
    };
  });

  const winner =
    game.winnerId !== null
      ? seats.find((s) => s.id === game.winnerId) || null
      : null;

  const math = computeDecisionMath(game);

  return {
    seats,
    dice,
    turnPot: game.turnPot,
    pendingPick: game.pendingPick,
    targetScore: game.targetScore,
    turnNumber: game.turnNumber,
    phase: game.phase,
    log: game.log,
    math,
    winner,
  };
}

function computeDecisionMath(game: Game) {
  if (game.phase !== "awaitingDecision" || game.isOver) {
    return null;
  }

  const liveDice = game.allDice.getLiveDice();
  const selectedDice = game.allDice.getSelectedDice();
  const wouldRemain = liveDice.length - selectedDice.length;
  const diceLeft = wouldRemain === 0 ? 6 : wouldRemain;
  const currentPot = game.turnPot + game.pendingPick;

  const bankValue = currentPot;
  const farkleProb = farkleChance(diceLeft);
  const expectedRoll = expectedValueOfRolling(currentPot, diceLeft);

  let verdict: "ROLL" | "BANK" | "BUST" | "HOT";
  if (diceLeft === 0) {
    verdict = "HOT";
  } else if (farkleProb > 0.5) {
    verdict = "BUST";
  } else if (expectedRoll > bankValue) {
    verdict = "ROLL";
  } else {
    verdict = "BANK";
  }

  const strategy = STRATEGIES[game.currentPlayer.strategy];
  const decision = strategy.decide({
    pot: currentPot,
    diceLeft,
    banked: game.currentPlayer.banked,
    leaderScore: game.leaderScore,
    target: game.targetScore,
    turnNumber: game.turnNumber,
  });

  return {
    diceLeft,
    farkleChance: farkleProb,
    expectedIfRoll: expectedRoll,
    certainIfBank: bankValue,
    verdict,
    reasoning: decision.reasoning,
  };
}
