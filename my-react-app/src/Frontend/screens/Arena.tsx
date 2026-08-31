import { useState } from 'react';
import './Arena.css';
import { Die } from '../components/Die';
import { SeatCard } from '../components/SeatCard';
import { SidePanel, type PanelMode } from '../components/SidePanel';
import { useGameEngine, type Speed } from '../hooks/useGameEngine';
import type { SeatConfig } from '../types';

const SPEEDS: Speed[] = [1, 2, 4];

interface Props {
  seats: SeatConfig[];
  target: number;
  onFinish: (snapshot: ReturnType<typeof useGameEngine>['snapshot']) => void;
}

export function Arena({ seats, target, onFinish }: Props) {
  const { snapshot, actions, speed, setSpeed } = useGameEngine(seats, target);
  const [panel, setPanel] = useState<PanelMode>('play');

  const active = snapshot.seats.find((s) => s.isActive) ?? snapshot.seats[0];
  const live = snapshot.dice.filter((d) => !d.locked);
  const locked = snapshot.dice.filter((d) => d.locked);
  const pot = snapshot.turnPot + snapshot.pendingPick;
  const yourTurn = active.isHuman && snapshot.phase !== 'gameOver';

  return (
    <div className="arena">
      <header className="arena-top">
        <div className="brand">
          <span className="brand-mark">
            <svg width="17" height="17" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="30" cy="30" r="11" fill="var(--paper)" />
              <circle cx="50" cy="50" r="11" fill="var(--paper)" />
              <circle cx="70" cy="70" r="11" fill="var(--paper)" />
            </svg>
          </span>
          <span className="brand-name">FarkleBots</span>
          <span className="brand-sub">
            Turn {snapshot.turnNumber} · race to {target.toLocaleString()}
          </span>
        </div>

        <div className="arena-controls">
          <div className="speeds">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className={`speed n${s === speed ? ' speed-on' : ''}`}
                onClick={() => setSpeed(s)}
                aria-pressed={s === speed}
              >
                {s}x
              </button>
            ))}
          </div>
          <span className="divider" />
          <div className="toggle" role="tablist" aria-label="Side panel">
            <button
              type="button" role="tab" aria-selected={panel === 'play'}
              className={`toggle-btn${panel === 'play' ? ' toggle-on' : ''}`}
              onClick={() => setPanel('play')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 3l14 9-14 9z" />
              </svg>
              Play
            </button>
            <button
              type="button" role="tab" aria-selected={panel === 'stats'}
              className={`toggle-btn${panel === 'stats' ? ' toggle-on' : ''}`}
              onClick={() => setPanel('stats')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 20h18M7 20V10M12 20V4M17 20v-7" />
              </svg>
              Stats
            </button>
          </div>
        </div>
      </header>

      <div className="seats">
        {snapshot.seats.map((seat) => (
          <SeatCard key={seat.id} seat={seat} target={target} />
        ))}
      </div>

      <div className="arena-body">
        <section className="table">
          <div className="pot">
            <span className={`pot-value n${snapshot.phase === 'farkle' ? ' pot-lost' : ''}`}>
              {pot.toLocaleString()}
            </span>
            <span className="pot-word">in the pot</span>
          </div>
          <p className="pot-note">lose it all if this roll scores nothing</p>

          <div className="dice">
            {live.map((die) => (
              <Die
                key={die.id}
                die={die}
                onClick={yourTurn ? () => actions.toggleDie(die.id) : undefined}
                disabled={!yourTurn}
              />
            ))}
          </div>

          {locked.length > 0 && (
            <div className="kept">
              <span className="kept-word">Kept</span>
              {locked.map((die) => <Die key={die.id} die={die} size="sm" />)}
              <span className="kept-points n">+{snapshot.turnPot}</span>
            </div>
          )}

          <div className="actions">
            {yourTurn && snapshot.phase === 'awaitingRoll' && (
              <button type="button" className="btn btn-primary" onClick={actions.roll}>
                Roll {live.length} {live.length === 1 ? 'die' : 'dice'}
              </button>
            )}
            {yourTurn && snapshot.phase === 'awaitingPick' && (
              <p className="prompt">Tap the dice that score to keep them.</p>
            )}
            {yourTurn && snapshot.phase === 'awaitingDecision' && (
              <>
                <button type="button" className="btn btn-primary" onClick={actions.bank}>
                  Bank {pot.toLocaleString()}
                </button>
                <button type="button" className="btn btn-secondary" onClick={actions.rollAgain}>
                  Roll again
                </button>
              </>
            )}
            {!yourTurn && snapshot.phase !== 'gameOver' && (
              <p className="prompt">{active.name} is playing.</p>
            )}
          </div>

          {snapshot.phase === 'farkle' && (
            <div className="overlay">
              <span className="overlay-title overlay-bad">Farkle!</span>
              <span className="overlay-sub">{snapshot.turnPot.toLocaleString()} points gone</span>
            </div>
          )}
          {snapshot.phase === 'hotDice' && (
            <div className="overlay">
              <span className="overlay-title overlay-good">Hot dice!</span>
              <span className="overlay-sub">all six scored, roll them all again</span>
            </div>
          )}
          {snapshot.phase === 'gameOver' && snapshot.winner && (
            <div className="overlay">
              <span className="overlay-title">{snapshot.winner.name} wins</span>
              <span className="overlay-sub">{snapshot.winner.banked.toLocaleString()} points</span>
              <button type="button" className="btn btn-primary overlay-btn" onClick={() => onFinish(snapshot)}>
                See the numbers
              </button>
            </div>
          )}
        </section>

        <SidePanel snapshot={snapshot} mode={panel} />
      </div>
    </div>
  );
}
