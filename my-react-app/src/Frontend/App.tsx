import { useState } from 'react';
import { Setup } from './screens/Setup';
import { Arena } from './screens/Arena';
import { Results } from './screens/Results';
import type { GameSnapshot, SeatConfig } from './types';

type Screen = 'setup' | 'arena' | 'results';

/**
 * Three screens and a little state. A router would be more machinery than three
 * views need, so navigation is a plain union in state.
 *
 * `runId` is bumped to remount Arena, which is how a rematch gets a fresh game
 * without the engine needing a reset path.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [seats, setSeats] = useState<SeatConfig[]>([]);
  const [target, setTarget] = useState(10000);
  const [runId, setRunId] = useState(0);
  const [finalSnapshot, setFinalSnapshot] = useState<GameSnapshot | null>(null);

  if (screen === 'setup') {
    return (
      <Setup
        onStart={(nextSeats, nextTarget) => {
          setSeats(nextSeats);
          setTarget(nextTarget);
          setRunId((n) => n + 1);
          setScreen('arena');
        }}
      />
    );
  }

  if (screen === 'arena') {
    return (
      <Arena
        key={runId}
        seats={seats}
        target={target}
        onFinish={(snapshot) => {
          setFinalSnapshot(snapshot);
          setScreen('results');
        }}
      />
    );
  }

  if (finalSnapshot === null) {
    setScreen('setup');
    return null;
  }

  return (
    <Results
      snapshot={finalSnapshot}
      onRematch={() => { setRunId((n) => n + 1); setScreen('arena'); }}
      onNewLineup={() => setScreen('setup')}
    />
  );
}
