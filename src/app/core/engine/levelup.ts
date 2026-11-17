/**
 * Level-up tracker: Volleyball Canada's Smashball rule. A unit moves up when
 * two out of its last three serve-receives end in a third-contact attack
 * (about 70% success), and can drop back down when it is struggling.
 */
import { SessionEvent } from '../models/session.models';
import { effectiveEvents } from './events';

export const WINDOW = 3;
export const NEEDED = 2;

export type LevelAdvice = 'up' | 'down' | 'stay' | 'collecting';

export interface UnitProgress {
  unit: string;
  /** Most recent attempts, oldest first (only those since the last level change). */
  recent: boolean[];
  /** Level relative to where the unit started (0 = starting level). */
  level: number;
  advice: LevelAdvice;
}

export function adviceFor(recent: readonly boolean[]): LevelAdvice {
  if (recent.length < WINDOW) {
    // Two successes out of two already meets "2 out of 3".
    return recent.filter(Boolean).length >= NEEDED ? 'up' : 'collecting';
  }
  const last = recent.slice(-WINDOW);
  const ok = last.filter(Boolean).length;
  if (ok >= NEEDED) return 'up';
  if (ok === 0) return 'down';
  return 'stay';
}

export function unitProgress(
  events: readonly SessionEvent[],
  courtId: string,
  units: readonly string[],
): UnitProgress[] {
  const byUnit = new Map<string, { recent: boolean[]; level: number }>(
    units.map((u) => [u, { recent: [], level: 0 }]),
  );
  for (const e of effectiveEvents(events)) {
    if (!('courtId' in e) || e.courtId !== courtId) continue;
    if (e.type === 'levelup.attempt') {
      const u = byUnit.get(e.unit) ?? { recent: [], level: 0 };
      u.recent = [...u.recent, e.success].slice(-WINDOW);
      byUnit.set(e.unit, u);
    } else if (e.type === 'levelup.change') {
      const u = byUnit.get(e.unit) ?? { recent: [], level: 0 };
      u.level += e.direction === 'up' ? 1 : -1;
      u.recent = [];
      byUnit.set(e.unit, u);
    }
  }
  return [...byUnit.entries()].map(([unit, u]) => ({
    unit,
    recent: u.recent,
    level: u.level,
    advice: adviceFor(u.recent),
  }));
}
