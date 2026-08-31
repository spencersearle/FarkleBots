import './Results.css';
import { TurnTape } from '../components/TurnTape';
import { ACCENT_VAR } from '../components/accents';
import type { GameSnapshot } from '../types';

interface Props {
  snapshot: GameSnapshot;
  onRematch: () => void;
  onNewLineup: () => void;
}

export function Results({ snapshot, onRematch, onNewLineup }: Props) {
  const ranked = [...snapshot.seats].sort((a, b) => b.banked - a.banked);
  const winner = ranked[0];

  return (
    <div className="results">
      <div className="results-top">
        <span className="label">
          Game over · {snapshot.turnNumber} turns · target {snapshot.targetScore.toLocaleString()}
        </span>
      </div>

      <div className="winner" style={{ '--accent': ACCENT_VAR[winner.accent] } as React.CSSProperties}>
        <span className="winner-avatar">{winner.name.charAt(0)}</span>
        <div className="winner-who">
          <div className="label winner-label">Winner</div>
          <h1 className="winner-name">{winner.name}</h1>
          <p className="winner-strategy">{winner.strategyLabel}</p>
        </div>
        <div className="winner-score">
          <div className="winner-value n">{winner.banked.toLocaleString()}</div>
          <div className="winner-caption">final score</div>
        </div>
      </div>

      <div className="board">
        <div className="board-head">
          <span className="label" />
          <span className="label">Player</span>
          <span className="label">Turn history</span>
          <span className="label right">Avg turn</span>
          <span className="label right">Farkle rate</span>
          <span className="label right">Final</span>
        </div>

        {ranked.map((seat, i) => (
          <div key={seat.id} className="board-row" style={{ '--accent': ACCENT_VAR[seat.accent] } as React.CSSProperties}>
            <span className={`board-rank n${i === 0 ? ' board-rank-win' : ''}`}>{i + 1}</span>
            <span className="board-who">
              <span className="board-avatar" style={{ background: ACCENT_VAR[seat.accent] }}>
                {seat.name.charAt(0)}
              </span>
              <span>
                <span className="board-name">{seat.name}</span>
                <span className="board-strategy">{seat.strategyLabel}</span>
              </span>
            </span>
            <span className="board-tape">
              <TurnTape history={seat.history} accent={ACCENT_VAR[seat.accent]} width={152} height={30} />
            </span>
            <span className="board-stat n">{seat.avgTurn}</span>
            <span className={`board-stat n${seat.farkleRate >= 0.3 ? ' hot' : ''}`}>
              {Math.round(seat.farkleRate * 100)}%
            </span>
            <span className="board-final n">{seat.banked.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="results-actions">
        <button type="button" className="btn btn-primary" onClick={onRematch}>Rematch</button>
        <button type="button" className="btn btn-secondary" onClick={onNewLineup}>Change the line-up</button>
        <span className="results-key">Red dots mark turns that ended in a farkle.</span>
      </div>
    </div>
  );
}
