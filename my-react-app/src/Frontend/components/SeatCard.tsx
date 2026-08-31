import './SeatCard.css';
import { ACCENT_VAR } from './accents';
import type { SeatView } from '../types';

export function SeatCard({ seat, target }: { seat: SeatView; target: number }) {
  const accent = ACCENT_VAR[seat.accent];
  const pct = Math.min((seat.banked / target) * 100, 100);

  return (
    <div
      className={`seat-card${seat.isActive ? ' seat-card-active' : ''}`}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <div className="seat-card-head">
        <span className="seat-avatar">{seat.name.charAt(0)}</span>
        <span className="seat-name">{seat.name}</span>
      </div>
      <div className="seat-score n">{seat.banked.toLocaleString()}</div>
      <div className="seat-track"><div className="seat-fill" style={{ width: `${pct}%` }} /></div>
      <div className="seat-strategy">{seat.strategyLabel}</div>
    </div>
  );
}
