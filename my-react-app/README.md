# FarkleBots

Farkle played by AI opponents with different appetites for risk. Bots play each
other, a human can take a seat, and the interface is built to show *why* each
bot decided what it decided rather than only what it rolled.

## Running it

```bash
cd my-react-app
npm install
npm run dev
```

The frontend runs standalone. It does not need the backend to be finished.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Oxlint |

## The game

Six dice. Roll, set aside the dice that score, then choose: bank what you are
holding, or reroll the rest for more. A roll that scores nothing is a **farkle**
and wipes everything you accumulated that turn. First to the target score wins.

Score all six and the dice come back **hot** with the pot intact.

## The screens

**Setup** picks two to five seats, gives each a strategy, and sets the target.

**Arena** is the main screen. Standings across the top, the pot and dice in the
middle, and a **Play / Stats** toggle in the top right that swaps the right-hand
column without moving anything else:

- *Play* shows the active bot's reasoning as a sentence, plus the two headline
  numbers.
- *Stats* shows the full decision math and a **turn tape** per bot: one spike per
  turn, height is the points that were at risk, a red dot means that turn
  farkled. A greedy policy is tall spikes littered with red; a careful one is a
  low even staircase.

**Results** shows the winner, per-bot statistics, and those same tapes side by
side.

## How the code is arranged

```
src/
  Backend/                 game model (Tony)
  Frontend/
    types.ts               GameSnapshot: the one shape the UI renders from
    engine/
      rules.ts             Farkle scoring, pure functions
      odds.ts              probabilities and expected values (Claire)
      strategies.ts        the rolling policies
      mockEngine.ts        a full game, simulated in the frontend
      adapter.ts           Backend/Game -> GameSnapshot  (the seam)
    hooks/                 useGameEngine
    components/            Die, SeatCard, TurnTape, SidePanel
    screens/               Setup, Arena, Results
```

### The snapshot boundary

The `Backend/` classes are mutable, and React does not re-render when a class
instance is mutated in place. So no component ever reads one. Instead:

```
Backend/Game (mutable)  ->  toSnapshot()  ->  GameSnapshot (immutable)  ->  React
```

`engine/adapter.ts` is that conversion and is currently a stub. When `Game` has
methods, filling in that one function switches the whole UI over to the real
engine. Nothing in `components/` or `screens/` changes.

Until then `engine/mockEngine.ts` plays a complete game in the frontend so the
interface can be built and demoed. It is a stand-in and can be deleted once the
backend is driving.

### Where the probability work plugs in

`engine/odds.ts` exports the farkle chance per dice count and the expected value
of rolling. The strategies and the on-screen decision math both read from it, so
replacing those numbers updates the bots and the display together.

### Scoring rules in use

Farkle has many regional variants. This one is written at the top of
`engine/rules.ts` and is the only place it is defined:

| Combination | Points |
| --- | --- |
| Single 1 | 100 |
| Single 5 | 50 |
| Three 1s | 1000 |
| Three of a kind (N) | N x 100 |
| Four of a kind | 1000 |
| Five of a kind | 2000 |
| Six of a kind | 3000 |
| Straight 1-6 | 1500 |
| Three pairs | 1500 |
| Two triplets | 2500 |

A lone 6 scores nothing, so `1 1 6` is 200, not 300.

## The strategies

| Strategy | Behaviour |
| --- | --- |
| Risky, greedy | Rolls while the chance of a farkle stays under 35% |
| Plays it safe | Banks once the turn is worth 300 |
| Greedier over time | Starts careful, raises its risk ceiling each turn |
| Safe when ahead | Cautious in the lead, greedy when behind |
| Never rolls one die | Will not throw a lone die whatever the pot is worth |

Each returns a decision **and** a sentence explaining itself, which is what the
Arena displays.

## Built with

React 19, TypeScript, Vite, plain CSS with custom properties. No UI framework.
Design tokens live at the top of `src/Frontend/index.css`.
