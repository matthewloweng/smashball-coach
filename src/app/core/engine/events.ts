import { SessionEvent } from '../models/session.models';

/**
 * Removes undone events (and the undo markers themselves).
 * An undo of an undo is not supported: undo is "take back the last tap".
 */
export function effectiveEvents(events: readonly SessionEvent[]): SessionEvent[] {
  const undone = new Set<string>();
  for (const e of events) {
    if (e.type === 'undo') undone.add(e.targetId);
  }
  return events.filter((e) => e.type !== 'undo' && !undone.has(e.id));
}

/** Events that belong to one court, in order. */
export function courtEvents(events: readonly SessionEvent[], courtId: string): SessionEvent[] {
  return events.filter((e) => 'courtId' in e && e.courtId === courtId);
}
