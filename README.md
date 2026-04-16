# GameCraft

A web-based board game designer/editor. Design Monopoly-style board games by editing rules, cards, board tiles, tokens, and building a personal component library.

Built with React 19, Vite, Tailwind CSS v4, and Firebase.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```
2. Set the `GEMINI_API_KEY` in `.env.local`
3. Start the dev server:
   ```
   npm run dev
   ```
   App runs on http://localhost:3000

## Firebase Emulators

For local development with Firebase services:

```
npm run emulator:start
npm run dev:emu
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite, port 3000) |
| `npm run build` | Production build |
| `npm run lint` | Type check (`tsc --noEmit`) |
| `npm run test` | Run tests (Vitest) |
| `npm run emulator:start` | Start Firebase Emulator Suite (with data persistence) |
| `npm run dev:emu` | Start dev server connected to emulators |
| `npm run emulator:seed` | Seed emulator with sample data |
