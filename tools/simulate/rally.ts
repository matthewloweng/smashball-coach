/**
 * A simple probabilistic volleyball rally model for generating sample data.
 * Not a physics model: just enough that serve errors, passing, setting,
 * attacking, blocking and digging shape outcomes the way they do in a
 * developing high school team.
 */

export interface Ratings {
  serve: number;
  pass: number;
  set: number;
  attack: number;
  block: number;
  dig: number;
}

/** Temporary changes from adaptation rules and level-ups. */
export interface Mods {
  serveBonus: number;
  passBonus: number;
  setBonus: number;
  attackPenalty: number;
  digPenalty: number;
  blockPenalty: number;
  catchSet: boolean;
  noTips: boolean;
}

export const noMods = (): Mods => ({
  serveBonus: 0,
  passBonus: 0,
  setBonus: 0,
  attackPenalty: 0,
  digPenalty: 0,
  blockPenalty: 0,
  catchSet: false,
  noTips: false,
});

export interface TeamInPlay {
  players: Ratings[];
  mods: Mods;
}

export type Start = 'serve' | 'free' | 'down';
export type FinishKind = 'serveError' | 'ace' | 'kill' | 'block' | 'attackError' | 'handlingError';
export type ShotKind = 'tip' | 'roll' | 'hard';

export interface RallyResult {
  winner: 0 | 1;
  finish: FinishKind;
  /** For kills: the shot that won the point. */
  shot: ShotKind | null;
  contacts: [number, number];
  crossings: number;
  threeContact: [boolean, boolean];
  attacksFaced: [number, number];
  attacksDug: [number, number];
  /** The receiving team turned the first ball (serve or free ball) into a third-contact attack. */
  firstBallAttack: boolean;
  seconds: number;
}

export type Rng = () => number;

/** Seeded random numbers, so the sample data is the same every time it is generated. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (x: number, lo = 0.02, hi = 0.98) => Math.min(hi, Math.max(lo, x));

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function best(players: readonly Ratings[], key: keyof Ratings, except?: Ratings): Ratings {
  return players
    .filter((p) => p !== except)
    .reduce((a, b) => (b[key] > a[key] ? b : a), players[0]!);
}

/**
 * Plays one rally. `server` is the team that starts it: it serves, or for
 * free/down balls the coach sends the ball to the other team.
 */
export function playRally(
  rng: Rng,
  teams: [TeamInPlay, TeamInPlay],
  server: 0 | 1,
  start: Start,
): RallyResult {
  const r: RallyResult = {
    winner: 0,
    finish: 'kill',
    shot: null,
    contacts: [0, 0],
    crossings: 0,
    threeContact: [false, false],
    attacksFaced: [0, 0],
    attacksDug: [0, 0],
    firstBallAttack: false,
    seconds: 0,
  };
  const end = (winner: 0 | 1, finish: FinishKind, shot: ShotKind | null = null): RallyResult => {
    r.winner = winner;
    r.finish = finish;
    r.shot = shot;
    const touches = r.contacts[0] + r.contacts[1];
    r.seconds = Math.round(5 + 2.2 * r.crossings + 1.2 * touches + rng() * 3);
    return r;
  };

  let receiving: 0 | 1 = server === 0 ? 1 : 0;
  // How hard the incoming ball is to play (0 easy ... 1 very hard), and whether it was attacked.
  let difficulty: number;
  let attacked = false;
  let firstBall = true;
  let lastShot: ShotKind = 'hard';

  if (start === 'serve') {
    const sTeam = teams[server];
    const srv = pick(rng, sTeam.players);
    const pIn = clamp(0.42 + 0.42 * srv.serve + sTeam.mods.serveBonus, 0.3, 0.95);
    if (rng() > pIn) return end(receiving, 'serveError');
    r.crossings++;
    difficulty = 0.25 + 0.45 * srv.serve + rng() * 0.2;
  } else {
    r.crossings++;
    difficulty = start === 'free' ? 0.05 + rng() * 0.1 : 0.3 + rng() * 0.2;
  }

  for (let guard = 0; guard < 30; guard++) {
    const team = teams[receiving];
    const opp: 0 | 1 = receiving === 0 ? 1 : 0;
    const m = team.mods;

    // First contact: pass or dig.
    const first = pick(rng, team.players);
    const skill = attacked ? first.dig - m.digPenalty : first.pass;
    const q1 = skill + m.passBonus - difficulty + (rng() - 0.5) * 0.5;
    if (attacked) r.attacksFaced[receiving]++;
    if (q1 < -0.32) {
      // Missed or shanked.
      if (q1 > -0.45) r.contacts[receiving]++;
      if (attacked) return end(opp, 'kill', lastShot);
      return end(opp, firstBall && start === 'serve' ? 'ace' : 'handlingError');
    }
    r.contacts[receiving]++;
    if (attacked) r.attacksDug[receiving]++;

    if (q1 < -0.12) {
      // Scrambled: the ball goes back over as a free ball.
      r.contacts[receiving] += rng() < 0.6 ? 1 : 0;
      r.crossings++;
      firstBall = false;
      attacked = false;
      difficulty = 0.08 + rng() * 0.12;
      receiving = opp;
      continue;
    }

    // Second contact: set.
    const setter = best(team.players, 'set', first);
    const q2 = setter.set + m.setBonus + (m.catchSet ? 0.25 : 0) + 0.35 * q1 + (rng() - 0.5) * 0.45;
    r.contacts[receiving]++;
    if (q2 < -0.05) {
      if (rng() < 0.35) return end(opp, 'handlingError');
      // Dead set: someone pushes it over.
      r.contacts[receiving]++;
      r.crossings++;
      firstBall = false;
      attacked = false;
      difficulty = 0.1 + rng() * 0.15;
      receiving = opp;
      continue;
    }

    // Third contact: attack.
    const hitters = team.players.filter((p) => p !== setter);
    const hitter = hitters.length ? pick(rng, hitters) : setter;
    r.contacts[receiving]++;
    r.threeContact[receiving] = true;
    if (firstBall) r.firstBallAttack = true;
    let power = hitter.attack - m.attackPenalty + 0.35 * q2 + (rng() - 0.5) * 0.5;
    const tipChance = m.noTips ? 0 : 0.28;
    const shot: ShotKind = rng() < tipChance ? (rng() < 0.55 ? 'tip' : 'roll') : 'hard';
    if (shot !== 'hard') power = 0.35 + 0.3 * hitter.attack;
    const errorChance =
      shot === 'hard' ? clamp(0.3 - 0.25 * hitter.attack + (m.noTips ? 0.06 : 0), 0.04, 0.4) : 0.05;
    if (rng() < errorChance) return end(opp, 'attackError');

    // Block.
    const blocker = best(teams[opp].players, 'block');
    const stuff = clamp(
      0.06 + 0.28 * (blocker.block - teams[opp].mods.blockPenalty) - 0.12 * hitter.attack,
      0.01,
      0.3,
    );
    if (shot === 'hard' && rng() < stuff) {
      r.contacts[opp]++;
      return end(opp, 'block');
    }

    r.crossings++;
    attacked = true;
    firstBall = false;
    lastShot = shot;
    difficulty = clamp(power, 0.15, 1);
    receiving = opp;
  }
  return end(receiving === 0 ? 1 : 0, 'handlingError');
}
