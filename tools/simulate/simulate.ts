/**
 * Generates the sample practices shipped with the app (public/samples/).
 *
 *   npx tsx tools/simulate/simulate.ts
 *
 * Every rally is simulated with a seeded random model (rally.ts) and fed
 * through the app's real engine, so adaptation rules switch on and change the
 * odds exactly as they would courtside. Players are anonymous rating sets:
 * no names, positions or descriptions are stored.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOLLEYBALL_PACK } from '../../src/app/content/volleyball/volleyball.pack';
import { activeRules } from '../../src/app/core/engine/adaptation';
import { adviceFor } from '../../src/app/core/engine/levelup';
import {
  MatchState,
  applyEvent,
  initialMatch,
  targetReached,
} from '../../src/app/core/engine/match';
import {
  CourtSetup,
  NewSessionEvent,
  Session,
  SessionEvent,
} from '../../src/app/core/models/session.models';
import {
  GameTemplate,
  SessionBlock,
  SessionPlan,
  Side,
} from '../../src/app/core/models/template.models';
import { Mods, Ratings, Rng, Start, TeamInPlay, mulberry32, noMods, playRally } from './rally';

/* ------------------------------------------------------------------ */
/* Squad: 11 anonymous rating sets (0-1). Serving is weak across the board. */
/* ------------------------------------------------------------------ */

const SQUAD: Ratings[] = [
  { serve: 0.4, pass: 0.55, set: 0.45, attack: 0.78, block: 0.72, dig: 0.5 },
  { serve: 0.3, pass: 0.28, set: 0.25, attack: 0.68, block: 0.52, dig: 0.28 },
  { serve: 0.32, pass: 0.52, set: 0.35, attack: 0.36, block: 0.3, dig: 0.48 },
  { serve: 0.38, pass: 0.5, set: 0.68, attack: 0.4, block: 0.38, dig: 0.48 },
  { serve: 0.3, pass: 0.42, set: 0.45, attack: 0.3, block: 0.28, dig: 0.42 },
  { serve: 0.4, pass: 0.55, set: 0.35, attack: 0.78, block: 0.52, dig: 0.5 },
  { serve: 0.42, pass: 0.78, set: 0.45, attack: 0.5, block: 0.2, dig: 0.78 },
  { serve: 0.22, pass: 0.28, set: 0.25, attack: 0.25, block: 0.2, dig: 0.3 },
  { serve: 0.4, pass: 0.6, set: 0.4, attack: 0.74, block: 0.5, dig: 0.55 },
  { serve: 0.32, pass: 0.38, set: 0.3, attack: 0.6, block: 0.35, dig: 0.38 },
  { serve: 0.32, pass: 0.36, set: 0.3, attack: 0.58, block: 0.34, dig: 0.36 },
];

/** Modest improvement across the six practices: mostly serving and passing. */
function improved(p: Ratings, practice: number): Ratings {
  const k = practice - 1;
  const up = (x: number, rate: number) => Math.min(0.95, x + rate * k);
  return {
    serve: up(p.serve, 0.03),
    pass: up(p.pass, 0.018),
    set: up(p.set, 0.012),
    attack: up(p.attack, 0.012),
    block: up(p.block, 0.008),
    dig: up(p.dig, 0.015),
  };
}

const overall = (p: Ratings) => p.serve + p.pass + p.set + p.attack + p.block + p.dig;

/** Practice dates (16:00 Pacific = 00:00 UTC next day) and attendance. */
const SCHEDULE = [
  { plan: 'p1', date: [2026, 10, 2], attendance: 11 },
  { plan: 'p2', date: [2026, 10, 4], attendance: 10 },
  { plan: 'p3', date: [2026, 10, 6], attendance: 11 },
  { plan: 'p4', date: [2026, 10, 9], attendance: 9 },
  { plan: 'p5', date: [2026, 10, 11], attendance: 11 },
  { plan: 'p6', date: [2026, 10, 13], attendance: 10 },
] as const;

const NOTES: Record<string, string> = {
  p1: 'Sample practice (simulated). Most 6v6 rallies ended on the serve or the first pass. In Monarch, pairs got far more touches, and the full-depth rule kicked in quickly on the stronger court.',
  p2: 'Sample practice (simulated). Tips and roll shots started to show up once the short and deep zones scored 2. The lead-by-3 rule kept lane games within a few points.',
  p3: 'Sample practice (simulated). Observers called "Base" most often. Covering the hitter improved in the second game.',
  p4: 'Sample practice (simulated). Smaller group today. Free balls gave every triple a three-contact chance; the trailing team used catch-and-set and games stayed close.',
  p5: 'Sample practice (simulated). Announcing the block helped the trailing team read the open space. Block points were rare but noticed.',
  p6: 'Sample practice (simulated). Wash games ran long; the down-ball rule stopped one team running away. End-of-unit 6v6 count is below.',
};

/* ------------------------------------------------------------------ */

const games = new Map(VOLLEYBALL_PACK.games.map((g) => [g.id, g]));
const gameFor = (id: string): GameTemplate => games.get(id)!;

class SessionBuilder {
  readonly events: SessionEvent[] = [];
  private n = 0;
  constructor(
    private readonly id: string,
    public t: number,
  ) {}

  push(e: NewSessionEvent, at = this.t): SessionEvent {
    const stamped = { ...e, id: `${this.id}-${++this.n}`, at } as SessionEvent;
    this.events.push(stamped);
    return stamped;
  }
}

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Snake-draft players into `count` teams by overall rating, with a little randomness. */
function draft(rng: Rng, players: Ratings[], count: number): Ratings[][] {
  const sorted = [...players].sort((a, b) => overall(b) + (rng() - 0.5) * 0.6 - overall(a));
  const teams: Ratings[][] = Array.from({ length: count }, () => []);
  sorted.forEach((p, i) => {
    const round = Math.floor(i / count);
    const idx = round % 2 === 0 ? i % count : count - 1 - (i % count);
    teams[idx]!.push(p);
  });
  return teams;
}

/** Turns the rules switched on for a side into rally modifiers. */
function modsFor(
  game: GameTemplate,
  state: MatchState,
  side: Side,
  adaptationsOn: boolean,
  levelPenalty: number,
): Mods {
  const m = noMods();
  m.attackPenalty += levelPenalty;
  for (const r of activeRules(game, state, adaptationsOn)) {
    if (r.side !== side) continue;
    switch (r.rule.id) {
      case 'g1-a2':
        m.digPenalty += 0.12;
        break; // Monarchs defend full 9 m
      case 'g1-a3':
        m.catchSet = true;
        break; // challengers catch-and-set
      case 'g2-a2':
      case 'g5-a2':
        m.serveBonus += 0.12;
        break; // serve from inside
      case 'g2-a3':
        m.digPenalty += 0.08;
        break; // wider lane to defend
      case 'g3-a2':
      case 'g4-a1':
        m.attackPenalty += 0.12;
        break; // back-row attacks only
      case 'g3-a3':
        m.passBonus += 0.15;
        break; // first pass may be caught
      case 'g4-a2':
        m.noTips = true;
        break;
      case 'g4-a3':
        m.catchSet = true;
        break;
      case 'g5-a1':
        m.blockPenalty += 0.15;
        break; // announced block
      case 'g6-a3':
        m.passBonus += 0.2;
        break; // high free ball to setter
    }
  }
  return m;
}

const isActive = (game: GameTemplate, state: MatchState, side: Side, ruleId: string, on: boolean) =>
  activeRules(game, state, on).some((r) => r.side === side && r.rule.id === ruleId);

interface CourtPlan {
  setup: CourtSetup;
  pool: Ratings[];
}

const unitLabelFor = (game: GameTemplate) =>
  game.scoring.mode === 'monarch'
    ? game.scoring.unitLabel
    : /\b2v2\b/.test(game.format)
      ? 'Pair'
      : /\b3v3\b/.test(game.format)
        ? 'Trio'
        : 'Team';

/** Splits the players present into courts for a game. */
function courtsFor(rng: Rng, game: GameTemplate, players: Ratings[]): CourtPlan[] {
  const shuffled = shuffle(rng, players);
  const label = (i: number) => `Court ${i + 1}`;
  if (game.scoring.mode === 'monarch') {
    const pairs = Math.floor(players.length / 2);
    const sizes = pairs >= 6 ? [3, 3] : pairs === 5 ? [3, 2] : [2, 2];
    let k = 0;
    return sizes.map((units, i) => {
      const pool = shuffled.slice(k, k + units * 2);
      k += units * 2;
      if (i === sizes.length - 1) pool.push(...shuffled.slice(k)); // the odd player rotates in here
      return { setup: { id: `court-${i + 1}`, label: label(i), gameId: game.id, units }, pool };
    });
  }
  const count = game.id === 'g6' ? 1 : game.id === 'g2' ? 2 : players.length >= 11 ? 2 : 1;
  const per = Math.ceil(players.length / count);
  return Array.from({ length: count }, (_, i) => ({
    setup: { id: `court-${i + 1}`, label: label(i), gameId: game.id },
    pool: shuffled.slice(i * per, (i + 1) * per),
  }));
}

/** Players per side on court for a team game. */
const sideSize = (game: GameTemplate) =>
  game.id === 'g6' ? 4 : /\b3v3\b|2\(1\)/.test(game.format) || game.id === 'g3' ? 3 : 2;

/* ------------------------------------------------------------------ */
/* Playing one block of one game on one court                          */
/* ------------------------------------------------------------------ */

interface CourtRun {
  plan: CourtPlan;
  game: GameTemplate;
  state: MatchState;
  /** Level offsets per unit name (positive = moved up, harder). */
  levels: Map<string, number>;
  attempts: Map<string, boolean[]>;
}

function recordAttempt(
  b: SessionBuilder,
  run: CourtRun,
  unit: string,
  success: boolean,
  rng: Rng,
): void {
  b.push({ type: 'levelup.attempt', courtId: run.plan.setup.id, unit, success });
  const recent = [...(run.attempts.get(unit) ?? []), success].slice(-3);
  run.attempts.set(unit, recent);
  const advice = adviceFor(recent);
  // The coach acts on most "up" prompts and some "down" prompts.
  const acts = advice === 'up' ? rng() < 0.55 : advice === 'down' ? rng() < 0.2 : false;
  if (acts && (advice === 'up' || advice === 'down')) {
    b.push(
      { type: 'levelup.change', courtId: run.plan.setup.id, unit, direction: advice },
      b.t + 20_000,
    );
    run.levels.set(unit, (run.levels.get(unit) ?? 0) + (advice === 'up' ? 1 : -1));
    run.attempts.set(unit, []);
  }
}

function apply(b: SessionBuilder, run: CourtRun, e: NewSessionEvent): void {
  const stamped = b.push(e);
  run.state = applyEvent(run.state, stamped, run.game);
}

function playTeamBlock(
  b: SessionBuilder,
  rng: Rng,
  run: CourtRun,
  startAt: number,
  endAt: number,
  adaptationsOn: boolean,
): void {
  const { game } = run;
  const size = sideSize(game);
  const label = unitLabelFor(game);
  const unitOf = (side: Side) => `${label} ${side === 'A' ? 1 : 2}`;
  const courtId = run.plan.setup.id;
  let t = startAt + 30_000;
  let server: 0 | 1 = rng() < 0.5 ? 0 : 1;

  const newTeams = () => {
    const pool = shuffle(rng, run.plan.pool);
    const [a, bb] = draft(rng, pool.slice(0, size * 2), 2);
    return [a!, bb!] as [Ratings[], Ratings[]];
  };
  let teams = newTeams();
  let rotationSwap = false;

  const sides: Side[] = ['A', 'B'];
  const mods = (side: Side): Mods =>
    modsFor(game, run.state, side, adaptationsOn, 0.05 * (run.levels.get(unitOf(side)) ?? 0));
  const inPlay = (): [TeamInPlay, TeamInPlay] => [
    { players: teams[0], mods: mods('A') },
    { players: teams[1], mods: mods('B') },
  ];

  // G4: a team that won the last game starts the next one 0-2 down.
  const handicapStart = () => {
    if (game.id !== 'g4' || !adaptationsOn) return;
    for (const side of sides) {
      if (isActive(game, run.state, side, 'g4-a4', adaptationsOn)) {
        const other: Side = side === 'A' ? 'B' : 'A';
        b.t = t;
        apply(b, run, { type: 'point', courtId, side: other, actionId: 'point', points: 1 });
        apply(b, run, { type: 'point', courtId, side: other, actionId: 'point', points: 1 });
      }
    }
  };
  handicapStart();

  while (t < endAt - 20_000) {
    b.t = t;
    if (game.scoring.mode === 'wash') {
      // Serve rally, then the coach's ball to the team that lost it.
      const big = playRally(rng, inPlay(), server, 'serve');
      t += (big.seconds + 6) * 1000;
      recordAttempt(b, run, unitOf(server === 0 ? 'B' : 'A'), big.firstBallAttack, rng);
      const loser: Side = big.winner === 0 ? 'B' : 'A';
      const loserIdx: 0 | 1 = loser === 'A' ? 0 : 1;
      const coachBall: Start = isActive(
        game,
        run.state,
        big.winner === 0 ? 'A' : 'B',
        'g6-a1',
        adaptationsOn,
      )
        ? 'down'
        : 'free';
      // The coach sends the ball to the loser: the "server" of the rally is the other team.
      const little = playRally(rng, inPlay(), (loserIdx === 0 ? 1 : 0) as 0 | 1, coachBall);
      t += (little.seconds + 6) * 1000;
      b.t = t;
      const winner: Side | 'split' =
        big.winner === little.winner ? (big.winner === 0 ? 'A' : 'B') : 'split';
      apply(b, run, { type: 'wash', courtId, winner });
      if (winner !== 'split') server = winner === 'A' ? 0 : 1;
      // Stay on court three times: rotate off and observe.
      if (
        isActive(game, run.state, 'A', 'g6-a2', adaptationsOn) ||
        isActive(game, run.state, 'B', 'g6-a2', adaptationsOn)
      ) {
        rotationSwap = true;
      }
    } else {
      const serving: Side = server === 0 ? 'A' : 'B';
      const receivingSide: Side = server === 0 ? 'B' : 'A';
      const rally = playRally(rng, inPlay(), server, 'serve');
      t += (rally.seconds + 7) * 1000;
      b.t = t;
      recordAttempt(b, run, unitOf(receivingSide), rally.firstBallAttack, rng);
      scoreRally(
        b,
        run,
        rally.winner === 0 ? 'A' : 'B',
        serving,
        rally.finish,
        rally.shot,
        rng,
        adaptationsOn,
      );
      server = rally.winner;
      if (game.id === 'g4') {
        // Tripleball: two coach free balls after each serve rally.
        const loserFirst: 0 | 1 = rally.winner === 0 ? 0 : 1; // ball goes to the team that lost
        for (const toTeam of [rally.winner === 0 ? 1 : 0, rally.winner] as (0 | 1)[]) {
          void loserFirst;
          const free = playRally(rng, inPlay(), (toTeam === 0 ? 1 : 0) as 0 | 1, 'free');
          t += (free.seconds + 5) * 1000;
          b.t = t;
          scoreRally(
            b,
            run,
            free.winner === 0 ? 'A' : 'B',
            null,
            free.finish,
            free.shot,
            rng,
            adaptationsOn,
          );
        }
      }
    }

    const won = targetReached(run.state, game.scoring);
    if (won) {
      t += 15_000;
      b.t = t;
      apply(b, run, { type: 'game.ended', courtId });
      teams = newTeams();
      rotationSwap = false;
      t += 40_000;
      handicapStart();
    } else if (rotationSwap) {
      teams = newTeams();
      rotationSwap = false;
    }
  }
  // End of the block: the coach ends the game in progress.
  if (run.state.margins.length) {
    b.t = endAt - 10_000;
    apply(b, run, { type: 'game.ended', courtId });
  }
}

function scoreRally(
  b: SessionBuilder,
  run: CourtRun,
  winner: Side,
  serving: Side | null,
  finish: string,
  shot: string | null,
  rng: Rng,
  adaptationsOn: boolean,
): void {
  const { game } = run;
  const courtId = run.plan.setup.id;
  // G3: a team that won the last game scores only on its own serve.
  if (
    game.id === 'g3' &&
    serving &&
    serving !== winner &&
    isActive(game, run.state, winner, 'g3-a1', adaptationsOn)
  )
    return;
  let actionId = 'point';
  let points = 1;
  if (game.id === 'g2' && finish === 'kill' && shot !== 'hard') {
    const shortZone = shot === 'tip';
    const loseShort = isActive(game, run.state, winner, 'g2-a1', adaptationsOn);
    if (shortZone && !loseShort) [actionId, points] = ['short', 2];
    if (!shortZone && rng() < 0.6) [actionId, points] = ['deep', 2];
  }
  if (game.id === 'g5') {
    const other: Side = winner === 'A' ? 'B' : 'A';
    const wider = isActive(game, run.state, other, 'g5-a3', adaptationsOn) ? 0.12 : 0;
    if (finish === 'block') [actionId, points] = ['block', 2];
    else if (finish === 'kill' && shot === 'hard' && rng() < 0.22 + wider)
      [actionId, points] = ['channel', 2];
  }
  apply(b, run, { type: 'point', courtId, side: winner, actionId, points });
}

function playMonarchBlock(
  b: SessionBuilder,
  rng: Rng,
  run: CourtRun,
  startAt: number,
  endAt: number,
  adaptationsOn: boolean,
): void {
  const units = run.plan.setup.units ?? 3;
  const pool = shuffle(rng, run.plan.pool);
  const pairs: Ratings[][] = Array.from({ length: units }, (_, i) => pool.slice(i * 2, i * 2 + 2));
  const extra = pool.slice(units * 2);
  const courtId = run.plan.setup.id;
  const unitName = (i: number) => `Pair ${i + 1}`;
  let t = startAt + 30_000;
  let rallies = 0;
  while (t < endAt - 20_000) {
    const m = run.state.monarch!;
    const monarchPair = [...pairs[m.monarch]!];
    const challengerPair = [...pairs[m.challenger]!];
    // The odd player swaps in now and then.
    if (extra.length && rallies % 4 === 3) challengerPair[0] = extra[0]!;
    const level = (i: number) => 0.05 * (run.levels.get(unitName(i)) ?? 0);
    const teams: [TeamInPlay, TeamInPlay] = [
      {
        players: monarchPair,
        mods: modsFor(run.game, run.state, 'A', adaptationsOn, level(m.monarch)),
      },
      {
        players: challengerPair,
        mods: modsFor(run.game, run.state, 'B', adaptationsOn, level(m.challenger)),
      },
    ];
    // Challengers serve to the Monarchs.
    const rally = playRally(rng, teams, 1, 'serve');
    t += (rally.seconds + 6) * 1000;
    b.t = t;
    recordAttempt(b, run, unitName(m.monarch), rally.firstBallAttack, rng);
    apply(b, run, { type: 'monarch.rally', courtId, winner: rally.winner === 0 ? 'A' : 'B' });
    rallies++;
  }
}

/* ------------------------------------------------------------------ */
/* Tally counts: watch one side for 3 minutes                           */
/* ------------------------------------------------------------------ */

function tallyRun(
  b: SessionBuilder,
  rng: Rng,
  at: number,
  context: string,
  players: Ratings[],
  perSide: number,
): void {
  const runId = `${b.events[0]?.id ?? 'x'}-run-${Math.round(at / 1000)}`;
  b.t = at;
  b.push({ type: 'tally.run', runId, sheetId: 'contact-count', context, durationSec: 180 });
  // The watched side (index 0) is the full one when someone is missing.
  const [a, bb] = draft(rng, shuffle(rng, players).slice(0, perSide * 2), 2).sort(
    (x, y) => y.length - x.length,
  );
  const teams: [TeamInPlay, TeamInPlay] = [
    { players: a!, mods: noMods() },
    { players: bb!, mods: noMods() },
  ];
  let t = at;
  let server: 0 | 1 = 0;
  let longest = 0;
  const dead = perSide >= 6 ? 12 : 7;
  const tap = (key: string, count: number) => {
    for (let i = 0; i < count; i++)
      b.push({ type: 'tally', runId, key, value: 1, mode: 'add' }, t + i * 400);
  };
  while (t < at + 180_000) {
    const rally = playRally(rng, teams, server, 'serve');
    t += (rally.seconds + dead) * 1000;
    if (t > at + 180_000) break;
    tap('rallies', 1);
    tap('contacts', rally.contacts[0]);
    if (rally.threeContact[0]) tap('threeContact', 1);
    tap('attacksFaced', rally.attacksFaced[0]);
    tap('attacksDug', rally.attacksDug[0]);
    longest = Math.max(longest, rally.crossings);
    server = rally.winner;
  }
  b.push({ type: 'tally', runId, key: 'longestRally', value: longest, mode: 'set' }, t);
  b.push(
    { type: 'tally', runId, key: 'players', value: teams[0].players.length, mode: 'set' },
    t + 500,
  );
}

/* ------------------------------------------------------------------ */
/* One practice                                                          */
/* ------------------------------------------------------------------ */

function simulatePractice(entry: (typeof SCHEDULE)[number], index: number): Session {
  const rng = mulberry32(437 + index * 101);
  const plan: SessionPlan = VOLLEYBALL_PACK.sessions.find((s) => s.id === entry.plan)!;
  const game = gameFor(plan.gameId);
  const [y, mo, d] = entry.date;
  const startedAt = Date.UTC(y, mo, d + 1, 0, 0, 0);
  const id = `sample-${plan.id}`;
  const b = new SessionBuilder(id, startedAt);

  const practice = index + 1;
  const absent = new Set(
    shuffle(
      rng,
      SQUAD.map((_, i) => i),
    ).slice(0, SQUAD.length - entry.attendance),
  );
  const players = SQUAD.filter((_, i) => !absent.has(i)).map((p) => improved(p, practice));

  const courtPlans = courtsFor(rng, game, players);
  const runs: CourtRun[] = courtPlans.map((plan) => ({
    plan,
    game,
    state: initialMatch(plan.setup.id, game, plan.setup.units),
    levels: new Map(),
    attempts: new Map(),
  }));

  let drift = 0;
  plan.blocks.forEach((block: SessionBlock, bi: number) => {
    drift += Math.round(rng() * 40_000);
    const blockStart = startedAt + block.startMin * 60_000 + drift;
    const blockEnd = startedAt + block.endMin * 60_000 + drift;
    b.t = blockStart;
    b.push({ type: 'block.started', blockIndex: bi });

    if (block.kind === 'baseline')
      tallyRun(b, rng, blockStart + 60_000, '6v6 baseline', players, 6);
    if (block.kind === 'transfer')
      tallyRun(b, rng, blockStart + 60_000, '6v6 end of unit', players, 6);
    if (block.kind === 'play') {
      const on = block.adaptationsOn ?? true;
      for (const run of runs) {
        if (game.scoring.mode === 'monarch')
          playMonarchBlock(b, rng, run, blockStart, blockEnd, on);
        else playTeamBlock(b, rng, run, blockStart, blockEnd, on);
      }
      // The last play block gets a small-sided count on one court.
      const lastPlay = plan.blocks.map((x) => x.kind).lastIndexOf('play') === bi;
      if (lastPlay)
        tallyRun(b, rng, blockStart + 90_000, `${game.code} small-sided`, players, sideSize(game));
    }
  });

  const events = [...b.events].sort((a, c) => a.at - c.at);
  const last = plan.blocks[plan.blocks.length - 1]!;
  return {
    id,
    packId: VOLLEYBALL_PACK.id,
    planId: plan.id,
    startedAt,
    endedAt: startedAt + last.endMin * 60_000 + drift + 60_000,
    courts: courtPlans.map((c) => c.setup),
    events,
    notes: NOTES[plan.id] ?? 'Sample practice (simulated).',
    sample: true,
  };
}

const sessions = SCHEDULE.map(simulatePractice);
const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../../public/samples/sample-practices.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ generatedBy: 'tools/simulate', sessions }));
for (const s of sessions)
  console.log(s.planId, s.courts.length, 'courts', s.events.length, 'events');
