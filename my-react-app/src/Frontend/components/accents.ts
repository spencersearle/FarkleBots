import type { AccentId } from '../types';

/** Seat accent to the CSS custom property that holds its colour. */
export const ACCENT_VAR: Record<AccentId, string> = {
  greedy: 'var(--seat-greedy)',
  cautious: 'var(--seat-cautious)',
  adaptive: 'var(--seat-adaptive)',
  human: 'var(--seat-human)',
  extra: 'var(--seat-extra)',
};

export const ACCENT_ORDER: AccentId[] = ['greedy', 'cautious', 'adaptive', 'human', 'extra'];
