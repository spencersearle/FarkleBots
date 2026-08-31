/**
 * Bridge from the Backend/ classes to the snapshot the UI renders.
 *
 * TONY: this is the only file that needs to know your shapes. When Game gains
 * methods, fill this in and swap the hook over; nothing in components/ or
 * screens/ has to change.
 *
 * What the UI needs that the current scaffolding does not carry:
 *   - the unbanked pot for the turn in progress
 *   - a name/id on Player, and a name on RollingStrategy
 *   - which dice are locked versus live (Dice.isFrozen may already cover this)
 *   - per-turn history, as {peak, busted}, for the turn tape
 *   - the target score
 *
 * Until then `useGameEngine` runs the frontend simulation in mockEngine.ts.
 */

import type { GameSnapshot } from '../types';

export function toSnapshot(_game: unknown): GameSnapshot {
  throw new Error('adapter.toSnapshot is not wired up yet; the UI runs on mockEngine.');
}
