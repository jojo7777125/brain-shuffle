// What the dealer says when you play a card. Written here (no AI call), so it's instant and free.
// The AI's line from the sort still shows until you play your first card.

const LINES = {
  now: ['Ace down. That was the big one.', 'Your Ace is on the table. Hardest part done.', 'Ace played. Everything else is lighter now.'],
  today: ['King played. Steady hands.', 'A King on the table. Good, keep moving.', 'King down. Nice and clean.'],
  later: ['A Queen, played early. Ahead of the game.', 'Queen down, and it wasn’t even due.', 'Played a Queen. Bonus round.'],
}

/**
 * @param task  the card you just played
 * @param next  your next card to play (or undefined if your hand is empty)
 * @param count how many cards you've played so far (picks a different line each time)
 */
export function dealerReact(task, next, count) {
  if (!next) return 'That’s the last card. The table is clear.'
  const options = LINES[task.priority]
  return `${options[count % options.length]} Next: ${next.title[0].toLowerCase()}${next.title.slice(1)}.`
}
