import samples from '../../../../public/samples/sample-practices.json';
import { summariseCourt } from '../../core/engine/metrics';
import { tallyRuns } from '../../core/engine/tally';
import { Session } from '../../core/models/session.models';
import { VOLLEYBALL_PACK } from './volleyball.pack';

const sessions = (samples as unknown as { sessions: Session[] }).sessions;
const gameFor = (id: string) => VOLLEYBALL_PACK.games.find((g) => g.id === id)!;

describe('shipped sample practices', () => {
  it('has one sample for each of the six plans, all marked as samples', () => {
    expect(sessions.map((s) => s.planId)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
    expect(sessions.every((s) => s.sample === true)).toBe(true);
  });

  it('replays cleanly through the engine with games, counts and level-ups', () => {
    for (const s of sessions) {
      const plan = VOLLEYBALL_PACK.sessions.find((p) => p.id === s.planId)!;
      const courts = s.courts.map((c) => summariseCourt(s, c.id, gameFor, plan.blocks));
      const played = courts.some((c) => c.games.length > 0 || (c.monarch?.rallies ?? 0) > 0);
      expect(played).toBe(true);
      expect(tallyRuns(s.events, VOLLEYBALL_PACK.tallySheets).length).toBeGreaterThan(0);
      expect(s.events.some((e) => e.type === 'levelup.attempt')).toBe(true);
    }
  });

  it('stores no names: units are anonymous labels only', () => {
    const units = new Set(
      sessions.flatMap((s) => s.events.flatMap((e) => ('unit' in e ? [e.unit] : []))),
    );
    for (const u of units) expect(u).toMatch(/^(Pair|Trio|Team) \d+$/);
  });
});
