# Escape of the Rat (فرار موش‌ها)

A social deduction party game for 5–10 players. One player is the **Dictator** (دیکتاتور), trying to escape with the help of **Devotees** (فدایی); the **Guards** (گارد جاویدان) must find and arrest the Dictator before they collect enough passports.

## How to run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`). The game is designed to be played on one device—pass the phone or tablet between players when it’s your turn.

## How to play

1. **Setup** — Enter 5–10 player names and start the game. Roles (Dictator, Devotees, Guards) are assigned secretly.
2. **Each round** — Everyone gets a hidden item: **Passports** (the Dictator team needs these to win), **Intel** (reveals a clue in phase 3), or a **Bug** (reveals who has the microphone in phase 3).
3. **Phase 1** — In turn order, each player sees their role and item. Devotees learn who the Dictator is.
4. **Phase 2** — Each player may secretly swap their item with another player. The Dictator team tries to move passports to their side.
5. **Phase 3** — Intel and Bug effects are revealed (clues about teams, who has the bug, etc.).
6. **Voting** — Guards vote on who to arrest. If they arrest the Dictator, the Guards win. If not, a new round starts.
7. **Win conditions** — **Dictator team wins** if they hold all required passports at the end of phase 2. **Guards win** if they arrest the Dictator in voting.

## Tech

- **React** + **Vite** + **Tailwind CSS**
- RTL (right-to-left) UI for Persian text

## Build

```bash
npm run build
npm run preview   # preview production build
```
