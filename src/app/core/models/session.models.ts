/**
 * Session models: what happens at practice.
 *
 * A session is an append-only list of events. Every screen (scoreboards,
 * tallies, level-ups, history) is worked out from those events by pure
 * reducers in core/engine. This keeps undo simple (drop the event), makes the
 * reducers easy to unit test, and leaves the door open to syncing several
 * phones later (Phase 3): devices only need to exchange events.
 *
 * No player names are stored anywhere. Units are anonymous labels.
 */
import { Side } from './template.models';

export interface Session {
  id: string;
  /** Template pack and plan this session follows. */
  packId: string;
  planId: string;
  startedAt: number;
  endedAt?: number;
  courts: CourtSetup[];
  events: SessionEvent[];
  /** Free notes for the coach's session log. Never names. */
  notes: string;
}

export interface CourtSetup {
  id: string;
  label: string;
  gameId: string;
}

/** Every event carries a timestamp (ms since epoch) and a unique id. */
interface EventBase {
  id: string;
  at: number;
}

export type SessionEvent =
  | BlockStartedEvent
  | PointEvent
  | WashEvent
  | MonarchRallyEvent
  | GameEndedEvent
  | CourtGameChangedEvent
  | TallyEvent
  | TallyRunEvent
  | LevelUpAttemptEvent
  | LevelChangeEvent
  | UndoEvent;

export interface BlockStartedEvent extends EventBase {
  type: 'block.started';
  blockIndex: number;
}

/** Rally scoring: a side scored `points` with one of the game's actions. */
export interface PointEvent extends EventBase {
  type: 'point';
  courtId: string;
  side: Side;
  actionId: string;
  points: number;
}

/** Wash scoring: one side won both balls, or the two balls were split. */
export interface WashEvent extends EventBase {
  type: 'wash';
  courtId: string;
  winner: Side | 'split';
}

/** Monarch scoring: who won the rally (Monarchs = A, challengers = B). */
export interface MonarchRallyEvent extends EventBase {
  type: 'monarch.rally';
  courtId: string;
  winner: Side;
}

/** The coach ends a game (or the target is reached and confirmed). */
export interface GameEndedEvent extends EventBase {
  type: 'game.ended';
  courtId: string;
}

export interface CourtGameChangedEvent extends EventBase {
  type: 'court.game';
  courtId: string;
  gameId: string;
}

/** Starts a timed tally count. */
export interface TallyRunEvent extends EventBase {
  type: 'tally.run';
  runId: string;
  sheetId: string;
  /** What was being watched, e.g. "6v6 baseline" or "G1 small-sided". */
  context: string;
  durationSec: number;
}

/** A tap (+1 / -1) or a typed value on a tally counter. */
export interface TallyEvent extends EventBase {
  type: 'tally';
  runId: string;
  key: string;
  /** For tap counters, +1 or -1. For number counters, the typed value. */
  value: number;
  mode: 'add' | 'set';
}

/** Volleyball Canada's level-up rule: did this serve-receive end in an attack? */
export interface LevelUpAttemptEvent extends EventBase {
  type: 'levelup.attempt';
  courtId: string;
  unit: string;
  success: boolean;
}

/** The coach moved a unit up (aid removed / harder constraint) or down (aid back). */
export interface LevelChangeEvent extends EventBase {
  type: 'levelup.change';
  courtId: string;
  unit: string;
  direction: 'up' | 'down';
}

/** Cancels an earlier event. */
export interface UndoEvent extends EventBase {
  type: 'undo';
  targetId: string;
}

/** Distributes Omit over a union, so each event type keeps its own fields. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An event before it has been stamped with an id and a time. */
export type NewSessionEvent = DistributiveOmit<SessionEvent, 'id' | 'at'>;
