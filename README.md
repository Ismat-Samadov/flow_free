# Flow Free — Connect the Dots

A neon-themed **Flow Free** puzzle game built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

Connect pairs of colored dots so every cell on the grid is filled.

---

## Features

| Feature | Details |
|---|---|
| **15 hand-crafted puzzles** | 5 Easy (5×5), 5 Medium (7×7), 5 Hard (9×9) |
| **Hint system** | Auto-solves one step using a backtracking engine |
| **High scores** | Best moves & time stored in localStorage |
| **Sound FX** | Procedural Web Audio — no audio files needed |
| **Background music** | Ambient neon-synth loop, toggleable |
| **Pause / Resume** | Full pause support with overlay |
| **Star rating** | 1–3 stars based on move efficiency |
| **Keyboard shortcuts** | `R` Reset · `P` Pause · `H` Hint · `←/→` Prev/Next |
| **Touch support** | Full pointer-event drag on mobile |
| **Canvas rendering** | HTML5 Canvas with neon glow effects |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Play

1. Click (or touch) a colored dot to start drawing a path.
2. Drag through cells to connect it to the matching dot.
3. Fill **every** cell on the grid to win.
4. Use **Hint** if you get stuck — it auto-extends the first incomplete path by one step.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `R` | Reset current puzzle |
| `P` | Pause / Resume |
| `H` | Apply hint |
| `←` | Previous puzzle |
| `→` | Next puzzle |
| `Esc` | Close panels |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout + metadata
│   ├── page.tsx          # Entry point
│   ├── globals.css       # Tailwind + glass-card utility
│   └── favicon.svg       # SVG favicon
├── components/
│   ├── Game/
│   │   ├── GameBoard.tsx      # Canvas renderer + pointer events
│   │   └── GameContainer.tsx  # Orchestrator (state, sound, keyboard)
│   └── UI/
│       ├── Header.tsx         # Title bar + levels toggle
│       ├── HUD.tsx            # Stats + control buttons
│       ├── WinModal.tsx       # Victory overlay with stars
│       └── LevelSelect.tsx    # Difficulty/puzzle picker
├── hooks/
│   ├── useGame.ts    # Game state, timer, hint system
│   └── useSound.ts   # SFX + ambient music (Web Audio API)
└── lib/
    ├── types.ts      # Shared TypeScript types
    ├── constants.ts  # Color palette + visual constants
    ├── puzzles.ts    # All 15 puzzle definitions
    ├── gameLogic.ts  # Pure game-state functions
    └── solver.ts     # Backtracking puzzle solver (for hints)
```

---

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **Framer Motion** — UI animations
- **HTML5 Canvas** — board rendering
- **Web Audio API** — procedural sound & music

---

## Deployment

Deploy to Vercel with zero configuration:

```bash
npx vercel
```

Or push to GitHub and connect the repo on [vercel.com](https://vercel.com).
