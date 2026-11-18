/**
 * Match reducer: turns one court's events into its scoreboard state.
 *
 * Pure functions only (no Angular, no storage), so every scoring mode can be
 * tested in isolation. To add a scoring mode, add a variant to ScoringConfig
 * and a case to `applyEvent`.
 */
import { SessionEvent } from '../models/session.models';
import {
  GameTemplate,
  MonarchScoring,
  ScoringConfig,
  Side,
  StreakUnit,
} from '../models/template.models';
import { effectiveEvents } from './events';

export type Score = Record<Side, number>;

export interface StreakCount {
  wins: number;
  losses: number;
}

export type Streaks = Record<Side, Partial<Record<StreakUnit, StreakCount>>>;

export interface MonarchState {
  /** Index of the unit holding the court (side A). */
  monarch: number;
  /** Index of the unit challenging (side B). */
  challenger: number;
  /** Units waiting, in order. */
  queue: number[];
  /** Rallies the current challenger has won in a row. */
  progress: number;
  /** Times each unit became Monarch (the team score in G1). */
  crowns: number[];
  /** Consecutive failed attempts per unit. */
  failedAttempts: number[];
  /** Challengers turned back by the current Monarchs. */
  defences: number;
}

export interface FinishedGame {
  gameId: string;
  score: Score;
  winner: Side | null;
  /** Margin (A minus B) after every scoring event, for closeness metrics. */
  margins: number[];
  startedAt: number;
  endedAt: number;
}

export interface MatchState {
  courtId: string;
  gameId: string;
  score: Score;
  /** Margin (A minus B) after every scoring event in the current game. */
  margins: number[];
  /** Points from each scoring action id, for zone tallies (e.g. short-zone kills). */
  actionCounts: Record<string, number>;
  /** Side that scored last, and its score before and after (for everyPoints cues). */
  lastPoint: { side: Side; from: number; to: number } | null;
  streaks: Streaks;
  monarch: MonarchState | null;
  finished: FinishedGame[];
  gameStartedAt: number | null;
}

export function emptyStreaks(): Streaks {
  return { A: {}, B: {} };
}

export function initialMatch(courtId: string, game: GameTemplate, units?: number): MatchState {
  return {
    courtId,
    gameId: game.id,
    score: { A: 0, B: 0 },
    margins: [],
    actionCounts: {},
    lastPoint: null,
    streaks: emptyStreaks(),
    monarch:
      game.scoring.mode === 'monarch'
        ? initialMonarch(units ?? game.scoring.challengerUnits)
        : null,
    finished: [],
    gameStartedAt: null,
  };
}

function initialMonarch(units: number): MonarchState {
  const n = Math.max(2, units);
  return {
    monarch: 0,
    challenger: 1,
    queue: Array.from({ length: n - 2 }, (_, i) => i + 2),
    progress: 0,
    crowns: Array<number>(n).fill(0),
    failedAttempts: Array<number>(n).fill(0),
    defences: 0,
  };
}

export const other = (side: Side): Side => (side === 'A' ? 'B' : 'A');

/** Adds a win for `winner` and a loss for the other side in `unit`. */
function bumpStreak(streaks: Streaks, unit: StreakUnit, winner: Side): Streaks {
  const loser = other(winner);
  const w = streaks[winner][unit] ?? { wins: 0, losses: 0 };
  const l = streaks[loser][unit] ?? { wins: 0, losses: 0 };
  return {
    ...streaks,
    [winner]: { ...streaks[winner], [unit]: { wins: w.wins + 1, losses: 0 } },
    [loser]: { ...streaks[loser], [unit]: { wins: 0, losses: l.losses + 1 } },
  } as Streaks;
}

/** Resets win streaks in `unit` for both sides (a wash split). */
function resetWins(streaks: Streaks, unit: StreakUnit): Streaks {
  const reset = (s: Side) => ({
    ...streaks[s],
    [unit]: { wins: 0, losses: streaks[s][unit]?.losses ?? 0 },
  });
  return { A: reset('A'), B: reset('B') };
}

function addPoints(
  state: MatchState,
  side: Side,
  points: number,
  at: number,
  actionId?: string,
): MatchState {
  const from = state.score[side];
  const score = { ...state.score, [side]: from + points } as Score;
  const actionCounts = actionId
    ? { ...state.actionCounts, [actionId]: (state.actionCounts[actionId] ?? 0) + 1 }
    : state.actionCounts;
  return {
    ...state,
    score,
    margins: [...state.margins, score.A - score.B],
    actionCounts,
    lastPoint: { side, from, to: score[side] },
    gameStartedAt: state.gameStartedAt ?? at,
  };
}

function endGame(state: MatchState, at: number): MatchState {
  const { score } = state;
  if (score.A === 0 && score.B === 0 && state.margins.length === 0) return state;
  const winner: Side | null = score.A === score.B ? null : score.A > score.B ? 'A' : 'B';
  const finished: FinishedGame = {
    gameId: state.gameId,
    score,
    winner,
    margins: state.margins,
    startedAt: state.gameStartedAt ?? at,
    endedAt: at,
  };
  return {
    ...state,
    score: { A: 0, B: 0 },
    margins: [],
    lastPoint: null,
    streaks: winner ? bumpStreak(state.streaks, 'game', winner) : state.streaks,
    finished: [...state.finished, finished],
    gameStartedAt: null,
  };
}

function monarchRally(
  state: MatchState,
  scoring: ScoringConfig,
  winner: Side,
  at: number,
): MatchState {
  if (!state.monarch || scoring.mode !== 'monarch') return state;
  const m = state.monarch;
  const failedAttempts = [...m.failedAttempts];
  const crowns = [...m.crowns];
  let next: MonarchState;
  let streaks = state.streaks;

  if (winner === 'B') {
    const progress = m.progress + 1;
    if (progress >= monarchTarget(scoring, m)) {
      // Challengers take the court; old Monarchs go to the back of the queue.
      crowns[m.challenger] = (crowns[m.challenger] ?? 0) + 1;
      failedAttempts[m.challenger] = 0;
      const [nextChallenger, ...rest] = [...m.queue, m.monarch];
      next = {
        monarch: m.challenger,
        challenger: nextChallenger ?? m.monarch,
        queue: rest,
        progress: 0,
        crowns,
        failedAttempts,
        defences: 0,
      };
      streaks = { ...streaks, A: { ...streaks.A, defence: { wins: 0, losses: 0 } } };
    } else {
      next = { ...m, progress };
    }
  } else {
    // Monarchs turn the challengers back; challengers go to the back of the queue.
    failedAttempts[m.challenger] = (failedAttempts[m.challenger] ?? 0) + 1;
    const [nextChallenger, ...rest] = [...m.queue, m.challenger];
    next = {
      ...m,
      challenger: nextChallenger ?? m.challenger,
      queue: rest,
      progress: 0,
      failedAttempts,
      defences: m.defences + 1,
    };
    streaks = { ...streaks, A: { ...streaks.A, defence: { wins: next.defences, losses: 0 } } };
  }

  // Side B's 'attempt' streak always describes the unit now challenging.
  streaks = {
    ...streaks,
    B: { ...streaks.B, attempt: { wins: 0, losses: next.failedAttempts[next.challenger] ?? 0 } },
  };

  return {
    ...state,
    monarch: next,
    score: { A: next.crowns[next.monarch] ?? 0, B: next.progress },
    lastPoint: null,
    streaks,
    gameStartedAt: state.gameStartedAt ?? at,
  };
}

/** Rallies in a row the current challengers need, after any easing rule. */
export function monarchTarget(scoring: MonarchScoring, m: MonarchState): number {
  const eased = scoring.easeAfterDefences !== undefined && m.defences >= scoring.easeAfterDefences;
  return eased ? (scoring.easedStreak ?? scoring.winStreak) : scoring.winStreak;
}

/** Applies one event to the match. Events for other courts are ignored. */
export function applyEvent(state: MatchState, event: SessionEvent, game: GameTemplate): MatchState {
  if (!('courtId' in event) || event.courtId !== state.courtId) return state;
  const scoring = game.scoring;
  switch (event.type) {
    case 'point':
      return scoring.mode === 'rally'
        ? addPoints(state, event.side, event.points, event.at, event.actionId)
        : state;
    case 'wash':
      if (scoring.mode !== 'wash') return state;
      if (event.winner === 'split') {
        return {
          ...state,
          streaks: resetWins(state.streaks, 'wash'),
          lastPoint: null,
          gameStartedAt: state.gameStartedAt ?? event.at,
        };
      }
      return {
        ...addPoints(state, event.winner, 1, event.at),
        streaks: bumpStreak(state.streaks, 'wash', event.winner),
      };
    case 'monarch.rally':
      return monarchRally(state, scoring, event.winner, event.at);
    case 'game.ended':
      return scoring.mode === 'monarch' ? state : endGame(state, event.at);
    default:
      return state;
  }
}

/**
 * Replays a court from the start of the session. `gameFor` looks up the game
 * template; when the court switches game, the score resets but finished games
 * and the session history are kept.
 */
export function replayCourt(
  courtId: string,
  startGameId: string,
  events: readonly SessionEvent[],
  gameFor: (id: string) => GameTemplate,
  units?: number,
): MatchState {
  let game = gameFor(startGameId);
  let state = initialMatch(courtId, game, units);
  for (const e of effectiveEvents(events)) {
    if (e.type === 'court.game' && e.courtId === courtId) {
      const ended = endGame(state, e.at);
      game = gameFor(e.gameId);
      state = { ...initialMatch(courtId, game, units), finished: ended.finished };
      continue;
    }
    state = applyEvent(state, e, game);
  }
  return state;
}

/** Whether a side has reached the game's target (rally and wash modes). */
export function targetReached(state: MatchState, scoring: ScoringConfig): Side | null {
  if (scoring.mode === 'monarch') return null;
  if (state.score.A >= scoring.target && state.score.A > state.score.B) return 'A';
  if (state.score.B >= scoring.target && state.score.B > state.score.A) return 'B';
  return null;
}
