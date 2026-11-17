import { GameTemplate, Side } from '../models/template.models';

/** Display name for a side of a game, e.g. "Pair A" or "Monarchs". */
export function sideLabel(game: GameTemplate, side: Side): string {
  const s = game.scoring;
  if (s.mode === 'monarch') return side === 'A' ? 'Monarchs' : 'Challengers';
  return side === 'A' ? s.sideLabels[0] : s.sideLabels[1];
}

/** "Pair 1", "Pair 2", ... for anonymous units. */
export function unitName(label: string, index: number): string {
  return `${label} ${index + 1}`;
}
