# AI Persona Library

> Wikipedia-depth profiles of iconic leaders — turned into AI agent personas you can install in any LLM with one click.

## What is this?

A curated library of 16 deep-research personas across Business, Tech, Film, Finance, and more. Each profile includes:

- **Thinking frameworks** — mental models and decision-making styles
- **Working patterns** — leadership, communication, and team dynamics
- **AI-ready system prompts** — copy-paste into ChatGPT, Claude, or any LLM
- **Personality radar** — quantified dimensions across 6 traits
- **Network graph** — relationships between personas

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Language | TypeScript |
| Fonts | Fraunces (display) + Inter (body) + JetBrains Mono |
| Toasts | Sonner |

## Getting Started

```bash
cd next-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Building

```bash
npm run build
npm start
```

## Project Structure

```
next-app/
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx          # Library index (card grid + filters + stack tray)
│   │   ├── persona/[id]/      # Persona detail page (6 tabs)
│   │   ├── match/             # Persona Match quiz + results
│   │   └── not-found.tsx      # 404 page
│   ├── lib/
│   │   └── personas.ts        # All persona data (16 personas)
│   ├── components/
│   │   ├── providers.tsx      # Sonner toaster provider
│   │   └── ui/sonner.tsx
│   └── styles/
│       └── globals.css        # Design system tokens + animations
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Features

- **Card library** with rarity tiers (Common → Ultra Rare)
- **Stack builder** — combine personas for composite AI prompts
- **Persona Match** — find your ideal stack via quiz
- **Category + region filters** with real-time search
- **One-click copy** for all AI prompts

## License

MIT
