/**
 * Session metrics for the reflection: how close the games stayed, and how
 * often the adaptation rules switched on. Closeness is the evidence for
 * modification-by-adaptation keeping competition balanced (Hopper, 2011).
 */
import { Session } from '../models/session.models';
import { GameTemplate } from '../models/template.models';
import { activeRules, newlyActive } from './adaptation';
import { effectiveEvents } from './events';
import { FinishedGame, applyEvent, initialMatch, replayCourt } from './match';

export interface GameCloseness {
  finalMargin: number;
  /** Mean of |margin| after every scoring event. */
  meanMargin: number;
  /** Largest |margin| reached during the game. */
  maxMargin: number;
}

export function closeness(game: FinishedGame): GameCloseness {
  const abs = game.margins.map(Math.abs);
  const mean = abs.length ? abs.reduce((a, b) => a + b, 0) / abs.length : 0;
  return {
    finalMargin: Math.abs(game.score.A - game.score.B),
    meanMargin: Math.round(mean * 10) / 10,
    maxMargin: abs.length ? Math.max(...abs) : 0,
  };
}

export interface CourtSummary {
  courtId: string;
  label: string;
  games: (FinishedGame & GameCloseness)[];
  /** Number of times an adaptation rule switched on during the session. */
  adaptationsTriggered: number;
  /** Share of finished games decided by 2 points or fewer. */
  closeGameShare: number | null;
}

export function summariseCourt(
  session: Session,
  courtId: string,
  gameFor: (id: string) => GameTemplate,
): CourtSummary {
  const court = session.courts.find((c) => c.id === courtId);
  if (!court) throw new Error(`Unknown court ${courtId}`);
  const state = replayCourt(courtId, court.gameId, session.events, gameFor);

  // Count rules switching on by replaying event by event.
  let game = gameFor(court.gameId);
  let match = initialMatch(courtId, game);
  let active = activeRules(game, match);
  let triggered = 0;
  for (const e of effectiveEvents(session.events)) {
    if (e.type === 'court.game' && e.courtId === courtId) {
      game = gameFor(e.gameId);
      match = initialMatch(courtId, game);
      active = activeRules(game, match);
      continue;
    }
    if (!('courtId' in e) || e.courtId !== courtId) continue;
    match = applyEvent(match, e, game);
    const now = activeRules(game, match);
    triggered += newlyActive(active, now).filter((r) => r.rule.kind === 'adaptation').length;
    active = now;
  }

  const games = state.finished.map((g) => ({ ...g, ...closeness(g) }));
  const close = games.filter((g) => g.finalMargin <= 2).length;
  return {
    courtId,
    label: court.label,
    games,
    adaptationsTriggered: triggered,
    closeGameShare: games.length ? close / games.length : null,
  };
}
