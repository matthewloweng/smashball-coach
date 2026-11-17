import { NewSessionEvent, SessionEvent } from '../models/session.models';
import { GameTemplate } from '../models/template.models';
import { VOLLEYBALL_PACK } from '../../content/volleyball/volleyball.pack';
import { activeRules, newlyActive } from './adaptation';
import { adviceFor, unitProgress } from './levelup';
import { replayCourt, targetReached } from './match';
import { closeness, summariseCourt } from './metrics';
import { derivedValues, tallyRuns } from './tally';

const games = new Map(VOLLEYBALL_PACK.games.map((g) => [g.id, g]));
const gameFor = (id: string): GameTemplate => {
  const g = games.get(id);
  if (!g) throw new Error(id);
  return g;
};

let n = 0;
const ev = (e: NewSessionEvent): SessionEvent =>
  ({ ...e, id: `e${++n}`, at: 1000 + n }) as SessionEvent;
const point = (side: 'A' | 'B', points = 1, actionId = 'point', courtId = 'c1') =>
  ev({ type: 'point', courtId, side, actionId, points });

describe('rally scoring and lead/trail triggers (G2)', () => {
  it('adds points, tracks margins and switches on lead-by-3 for the leader only', () => {
    const events = [point('A'), point('A', 2, 'short'), point('B'), point('A', 2, 'deep')];
    const s = replayCourt('c1', 'g2', events, gameFor);
    expect(s.score).toEqual({ A: 5, B: 1 });
    expect(s.margins).toEqual([1, 3, 2, 4]);
    expect(s.actionCounts).toEqual({ point: 2, short: 1, deep: 1 });

    const active = activeRules(gameFor('g2'), s);
    const keys = active.map((r) => r.key);
    expect(keys).toContain('g2-a1:A'); // lead by 3
    expect(keys).toContain('g2-a2:B'); // trail by 3
    expect(keys).not.toContain('g2-a1:B');
  });

  it('respects undo', () => {
    const p = point('A', 2, 'short');
    const events = [p, ev({ type: 'undo', targetId: p.id })];
    expect(replayCourt('c1', 'g2', events, gameFor).score).toEqual({ A: 0, B: 0 });
  });

  it('ends a game, records it and starts the game-win streak', () => {
    const events = [point('A'), point('A'), ev({ type: 'game.ended', courtId: 'c1' })];
    const s = replayCourt('c1', 'g2', events, gameFor);
    expect(s.score).toEqual({ A: 0, B: 0 });
    expect(s.finished).toHaveLength(1);
    expect(s.finished[0]?.winner).toBe('A');
    expect(s.streaks.A.game).toEqual({ wins: 1, losses: 0 });
    expect(s.streaks.B.game).toEqual({ wins: 0, losses: 1 });
  });

  it('switches off adaptations when they are turned off for a block', () => {
    const s = replayCourt('c1', 'g2', [point('A'), point('A'), point('A')], gameFor);
    expect(activeRules(gameFor('g2'), s, false)).toHaveLength(0);
  });

  it('reports when a side reaches the target', () => {
    const events = Array.from({ length: 11 }, () => point('B'));
    const s = replayCourt('c1', 'g2', events, gameFor);
    expect(targetReached(s, gameFor('g2').scoring)).toBe('B');
  });
});

describe('game streak triggers (G4)', () => {
  it('flags the winner of the last game, and lead-by-2 / lead-by-4 stack', () => {
    const g = gameFor('g4');
    const end = () => ev({ type: 'game.ended', courtId: 'c1' });
    const s = replayCourt(
      'c1',
      'g4',
      [point('B'), end(), point('A'), point('A'), point('A'), point('A')],
      gameFor,
    );
    const keys = activeRules(g, s).map((r) => r.key);
    expect(keys).toEqual(expect.arrayContaining(['g4-a1:A', 'g4-a2:A', 'g4-a3:B', 'g4-a4:B']));
  });
});

describe('every-points rotation cues (G3)', () => {
  it('cues Team A every 2 points and Team B every 3', () => {
    const g = gameFor('g3');
    let s = replayCourt('c1', 'g3', [point('A')], gameFor);
    expect(activeRules(g, s).map((r) => r.key)).not.toContain('g3-rot-a:A');
    s = replayCourt('c1', 'g3', [point('A'), point('A')], gameFor);
    expect(activeRules(g, s).map((r) => r.key)).toContain('g3-rot-a:A');
    s = replayCourt('c1', 'g3', [point('B'), point('B'), point('B')], gameFor);
    expect(activeRules(g, s).map((r) => r.key)).toContain('g3-rot-b:B');
  });
});

describe('Monarch scoring (G1)', () => {
  const rally = (winner: 'A' | 'B') => ev({ type: 'monarch.rally', courtId: 'c1', winner });

  it('crowns challengers after three rallies in a row', () => {
    const s = replayCourt('c1', 'g1', [rally('B'), rally('B'), rally('B')], gameFor);
    expect(s.monarch?.monarch).toBe(1);
    expect(s.monarch?.crowns).toEqual([0, 1, 0]);
    expect(s.monarch?.challenger).toBe(2);
    expect(s.monarch?.queue).toEqual([0]);
  });

  it('counts defences and failed attempts for the adaptation rules', () => {
    const g = gameFor('g1');
    // Monarchs (pair 0) turn back pair 1, then pair 2: two defences.
    let s = replayCourt('c1', 'g1', [rally('A'), rally('A')], gameFor);
    expect(s.monarch?.defences).toBe(2);
    expect(activeRules(g, s).map((r) => r.key)).toContain('g1-a2:A');
    // Pair 1 is back and fails again: two failed attempts in a row.
    s = replayCourt('c1', 'g1', [rally('A'), rally('A'), rally('A')], gameFor);
    expect(s.monarch?.challenger).toBe(2);
    s = replayCourt('c1', 'g1', [rally('A'), rally('A'), rally('A'), rally('A')], gameFor);
    expect(s.monarch?.challenger).toBe(1);
    expect(activeRules(g, s).map((r) => r.key)).toContain('g1-a3:B');
  });
});

describe('wash scoring (G6)', () => {
  const wash = (winner: 'A' | 'B' | 'split') => ev({ type: 'wash', courtId: 'c1', winner });

  it('scores only full wins, and a split resets win streaks', () => {
    let s = replayCourt('c1', 'g6', [wash('A'), wash('split'), wash('A')], gameFor);
    expect(s.score).toEqual({ A: 2, B: 0 });
    expect(s.streaks.A.wash?.wins).toBe(1);
    s = replayCourt('c1', 'g6', [wash('A'), wash('A')], gameFor);
    expect(activeRules(gameFor('g6'), s).map((r) => r.key)).toContain('g6-a1:A');
  });
});

describe('newlyActive', () => {
  it('returns only rules that just switched on', () => {
    const g = gameFor('g2');
    const before = activeRules(g, replayCourt('c1', 'g2', [point('A'), point('A')], gameFor));
    const after = activeRules(
      g,
      replayCourt('c1', 'g2', [point('A'), point('A'), point('A')], gameFor),
    );
    expect(newlyActive(before, after).map((r) => r.key)).toEqual(['g2-a1:A', 'g2-a2:B']);
  });
});

describe('level-up rule (2 out of 3)', () => {
  it('advises up, stay or down', () => {
    expect(adviceFor([true, true])).toBe('up');
    expect(adviceFor([true])).toBe('collecting');
    expect(adviceFor([true, false, true])).toBe('up');
    expect(adviceFor([false, true, false])).toBe('stay');
    expect(adviceFor([false, false, false])).toBe('down');
  });

  it('resets the window after a level change', () => {
    const a = (success: boolean) =>
      ev({ type: 'levelup.attempt', courtId: 'c1', unit: 'Pair 1', success });
    const events = [
      a(true),
      a(true),
      ev({ type: 'levelup.change', courtId: 'c1', unit: 'Pair 1', direction: 'up' }),
      a(false),
    ];
    const [p] = unitProgress(events, 'c1', ['Pair 1']);
    expect(p?.level).toBe(1);
    expect(p?.recent).toEqual([false]);
    expect(p?.advice).toBe('collecting');
  });
});

describe('tallies', () => {
  it('sums taps, sets typed values and works out ratios', () => {
    const sheet = VOLLEYBALL_PACK.tallySheets[0]!;
    const t = (key: string, value: number, mode: 'add' | 'set' = 'add') =>
      ev({ type: 'tally', runId: 'r1', key, value, mode });
    const events = [
      ev({
        type: 'tally.run',
        runId: 'r1',
        sheetId: sheet.id,
        context: '6v6 baseline',
        durationSec: 180,
      }),
      t('contacts', 1),
      t('contacts', 1),
      t('contacts', 1),
      t('contacts', -1),
      t('rallies', 1),
      t('rallies', 1),
      t('threeContact', 1),
      t('longestRally', 4, 'set'),
      t('longestRally', 2, 'set'),
      t('players', 6, 'set'),
    ];
    const [run] = tallyRuns(events, VOLLEYBALL_PACK.tallySheets);
    expect(run?.values).toMatchObject({
      contacts: 2,
      rallies: 2,
      threeContact: 1,
      longestRally: 2,
      players: 6,
    });
    const d = derivedValues(run!, sheet);
    expect(d.find((x) => x.key === 'threeContactShare')?.display).toBe('50%');
    expect(d.find((x) => x.key === 'digRate')?.value).toBeNull();
  });
});

describe('metrics', () => {
  it('measures closeness and counts adaptations switching on', () => {
    const events = [
      point('A'),
      point('A'),
      point('A'),
      point('B'),
      ev({ type: 'game.ended', courtId: 'c1' }),
    ];
    const summary = summariseCourt(
      {
        id: 's',
        packId: 'x',
        planId: 'p2',
        startedAt: 0,
        courts: [{ id: 'c1', label: 'Court 1', gameId: 'g2' }],
        events,
        notes: '',
      },
      'c1',
      gameFor,
    );
    expect(summary.games[0]?.finalMargin).toBe(2);
    expect(summary.games[0]?.maxMargin).toBe(3);
    expect(summary.adaptationsTriggered).toBe(2); // lead by 3 (A) and trail by 3 (B)
    expect(summary.closeGameShare).toBe(1);
    expect(
      closeness({
        gameId: 'g2',
        score: { A: 0, B: 0 },
        winner: null,
        margins: [],
        startedAt: 0,
        endedAt: 0,
      }).meanMargin,
    ).toBe(0);
  });
});
