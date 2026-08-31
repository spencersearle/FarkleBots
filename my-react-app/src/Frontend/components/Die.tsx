import './Die.css';
import type { DieView } from '../types';

/** Pip positions on a 100x100 face, indexed by die value. */
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]],
};

interface Props {
  die: DieView;
  size?: 'lg' | 'sm';
  onClick?: () => void;
  disabled?: boolean;
}

export function Die({ die, size = 'lg', onClick, disabled }: Props) {
  const state = die.locked ? 'locked'
    : die.selected ? 'selected'
    : die.scoring ? 'scoring'
    : 'idle';

  const px = size === 'lg' ? 54 : 22;
  const interactive = Boolean(onClick) && !disabled && !die.locked;

  const content = (
    <svg viewBox="0 0 100 100" width={px} height={px} aria-hidden="true">
      {(PIPS[die.value] ?? []).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={size === 'lg' ? 10.5 : 12} />
      ))}
    </svg>
  );

  const label = `${die.value}${die.locked ? ', set aside' : die.selected ? ', kept' : ''}`;

  if (!interactive) {
    return <div className={`die die-${size} die-${state}`} aria-label={label}>{content}</div>;
  }
  return (
    <button
      type="button"
      className={`die die-${size} die-${state}`}
      onClick={onClick}
      aria-pressed={die.selected}
      aria-label={label}
    >
      {content}
    </button>
  );
}
