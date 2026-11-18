# Brain Shuffle

Write down everything on your mind: tasks, worries, reminders, ideas. It sorts it into a hand of playing cards and a plan for today.

- **Suit = category:** ♠ school, ♣ work, ♥ personal, ♦ errands
- **Rank = priority:** Aces are "do now", Kings are "today", Queens are "later"
- **Today:** a schedule starting from the current time, with breaks
- **Set aside:** worries and ideas, out of your head and off your list

Built for the Triple H Hackathon 2026 (productivity theme).

## How it works

1. The browser sends your text to `/api/sort`, a Vercel serverless function ([api/sort.js](api/sort.js)).
2. The function asks Claude to sort it and forces the reply to match a fixed JSON schema. The API key stays on the server.
3. The app checks the result again ([src/lib/schema.js](src/lib/schema.js)) and deals the cards.
4. If the AI is unavailable, an offline keyword sorter ([src/lib/mockSort.js](src/lib/mockSort.js)) takes over, so the app always works.

## Run it locally

```bash
npm install
npm run dev
```

Add your key to `.env.local` (copy `.env.example`): `ANTHROPIC_API_KEY=...`

Stack: Vite, React, Tailwind CSS, Motion, Claude API, Vercel.
