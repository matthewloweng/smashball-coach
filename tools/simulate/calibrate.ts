/**
 * Checks a roster of coach-estimated ratings against what you see in matches.
 *
 *   npx tsx tools/simulate/calibrate.ts roster.json
 *   npx tsx tools/simulate/calibrate.ts roster.json --target-blocks 0.125
 *
 * Plays the starting six against an identical copy of itself (an evenly
 * matched opponent) and reports how points end: serve errors, aces, kills,
 * attack errors and blocks, with block points split by position.
 *
 * --target-blocks finds one multiplier for every player's block rating so
 * that this share of the points your team wins come from your blocks
 * (0.125 = 1 in 8), keeping the order of your ratings, and prints the
 * adjusted ratings.
 *
 * Keep roster.json out of the repo: the ratings describe real players.
 * Format:
 *   {
 *     "players": { "S1": { "position": "S", "serve": 0.5, "pass": 0.38, ... }, ... },
 *     "starters": ["S1", "OH1", "MB1", "OPP", "OH2", "MB2"],
 *     "libero": { "player": "L", "replaces": "MB2" }
 *   }
 * The libero replaces that player in half the rallies (their back-row turns).
 */
import { readFileSync } from 'node:fs';
import { FinishKind, Position, Ratings, mulberry32, noMods, playRally } from './rally';

interface Roster {
  players: Record<string, Ratings>;
  starters: string[];
  libero?: { player: string; replaces: string };
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : undefined;
};
if (!file) {
  console.error('Usage: npx tsx tools/simulate/calibrate.ts roster.json [--target-blocks 0.125] [--rallies 100000]');
  process.exit(1);
}

const roster = JSON.parse(readFileSync(file, 'utf8')) as Roster;
const RALLIES = flag('--rallies') ?? 100_000;
const POSITIONS: Position[] = ['S', 'MB', 'OPP', 'OH', 'L'];

for (const [label, p] of Object.entries(roster.players)) {
  if (!p.position || !POSITIONS.includes(p.position)) {
    console.error(`${label}: position must be one of ${POSITIONS.join(', ')}`);
    process.exit(1);
  }
}
for (const label of [...roster.starters, roster.libero?.player, roster.libero?.replaces]) {
  if (label && !roster.players[label]) {
    console.error(`Unknown player "${label}" in starters or libero`);
    process.exit(1);
  }
}

interface Result {
  servesIn: number;
  finishes: Record<FinishKind, number>;
  blocksBy: Record<Position, number>;
  teamABlocks: number;
  teamAWins: number;
}

/** Your blocks as a share of the points your team won: what a coach tallies. */
const blocksPerWin = (res: Result) => res.teamABlocks / (res.teamAWins || 1);

function simulate(blockScale: number): Result {
  const scaled = (label: string): Ratings => {
    const p = roster.players[label]!;
    return { ...p, block: p.block * blockScale };
  };
  const withLibero = roster.starters.map((l) =>
    roster.libero && l === roster.libero.replaces ? scaled(roster.libero.player) : scaled(l),
  );
  const without = roster.starters.map(scaled);

  const rng = mulberry32(437);
  const finishes = { serveError: 0, ace: 0, kill: 0, block: 0, attackError: 0, handlingError: 0 };
  const blocksBy = { S: 0, MB: 0, OPP: 0, OH: 0, L: 0 };
  let server: 0 | 1 = 0;
  let teamABlocks = 0;
  let teamAWins = 0;
  for (let i = 0; i < RALLIES; i++) {
    const side = () => ({ players: roster.libero && rng() < 0.5 ? withLibero : without, mods: noMods() });
    const r = playRally(rng, [side(), side()], server, 'serve');
    finishes[r.finish]++;
    if (r.winner === 0) teamAWins++;
    if (r.finish === 'block') {
      if (r.blockedBy) blocksBy[r.blockedBy]++;
      if (r.winner === 0) teamABlocks++;
    }
    server = r.winner;
  }
  return { servesIn: 1 - finishes.serveError / RALLIES, finishes, blocksBy, teamABlocks, teamAWins };
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const oneIn = (n: number) => (n > 0 ? ` (1 in ${(1 / n).toFixed(1)})` : '');

function report(res: Result): void {
  console.log(`Rallies simulated: ${RALLIES.toLocaleString()} (starting six vs an identical team)`);
  console.log(`Serves in: ${pct(res.servesIn)}`);
  console.log('How points end:');
  for (const [k, v] of Object.entries(res.finishes)) {
    console.log(`  ${k.padEnd(14)} ${pct(v / RALLIES).padStart(6)}${oneIn(v / RALLIES)}`);
  }
  console.log(`Your blocks, out of points you won: ${pct(blocksPerWin(res))}${oneIn(blocksPerWin(res))}`);
  const total = res.finishes.block || 1;
  console.log('Block points by position:');
  for (const pos of POSITIONS) console.log(`  ${pos.padEnd(4)} ${pct(res.blocksBy[pos] / total)}`);
}

const target = flag('--target-blocks');
if (target === undefined) {
  report(simulate(1));
} else {
  // Block share rises with the multiplier, so bisect on it.
  let lo = 0;
  let hi = 2;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (blocksPerWin(simulate(mid)) < target) lo = mid;
    else hi = mid;
  }
  const scale = (lo + hi) / 2;
  const res = simulate(scale);
  report(res);
  const reached = Math.abs(blocksPerWin(res) - target) < 0.005;
  console.log(
    reached
      ? `\nMultiplier on block ratings: ${scale.toFixed(2)}`
      : `\nCould not reach ${pct(target)} (closest multiplier ${scale.toFixed(2)}): the block formula caps out.`,
  );
  console.log('Adjusted block ratings:');
  for (const [label, p] of Object.entries(roster.players)) {
    const b = p.block * scale;
    console.log(`  ${label.padEnd(5)} ${p.position!.padEnd(4)} ${p.block.toFixed(2)} -> ${b.toFixed(2)}${b > 1 ? '  (above 1)' : ''}`);
  }
}
