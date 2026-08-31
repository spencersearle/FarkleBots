/**
 * Re-export Farkle rules from the backend.
 * The backend is now the source of truth for scoring logic.
 */

export { type ScoreResult, scoreAll, isFarkle, scoreSelection, scoringIndexes, rollDice } from '../../Backend/farkleRules';
