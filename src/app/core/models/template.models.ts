/**
 * Template models: everything a coach plans before practice.
 *
 * These types describe games, progressions and session plans as plain data
 * (no functions, no class instances) so that a template pack can be stored,
 * exported as JSON, imported and, later, built in an editor (Phase 2).
 * Nothing in here is volleyball-specific: volleyball is just the first pack.
 */

/** The two teams on a court. A is always drawn on the left of the scoreboard. */
export type Side = 'A' | 'B';

/** Tactical concepts used across EPHE 437 (Hopper & Rhoades, 2022b; Hopper, 2024). */
export type TacticalConcept = 'Time' | 'Space' | 'Force' | 'Risk';

export interface TemplatePack {
  /** Stable id, e.g. "volleyball-smashball". */
  id: string;
  /** Bumped when the shape of a pack changes, so imports can migrate. */
  schemaVersion: 1;
  name: string;
  sport: string;
  description: string;
  author: string;
  levels: LevelTemplate[];
  games: GameTemplate[];
  taskCards: TaskCard[];
  tallySheets: TallySheetTemplate[];
  sessions: SessionPlan[];
  /** Short glossary entries (e.g. BIOMECS letters) shown next to task cards. */
  glossary: GlossaryEntry[];
}

export interface LevelTemplate {
  id: string;
  /** Short label such as "A" or "B". */
  code: string;
  name: string;
  format: string;
  contacts: string;
  aid: string;
}

export interface GameTemplate {
  id: string;
  /** Short code shown on buttons, e.g. "G1". */
  code: string;
  name: string;
  levelId: string;
  focus: TacticalConcept[];
  /** 4Rs focus, as a sentence. */
  fourRs: string;
  format: string;
  players: string;
  rear: RearDesign;
  rules: string[];
  scoring: ScoringConfig;
  adaptations: AdaptationRule[];
  huddleQuestions: HuddleQuestion[];
  /** Optional court diagram, in metres (see CourtDiagram). */
  diagram?: CourtDiagram;
}

/** REAR framework (Hopper & Gopalan Srinivasa, in press). */
export interface RearDesign {
  representation: string;
  exaggeration: string;
  adaptation: string;
  rotation: string;
}

/**
 * Court diagram in metres. u = distance from the net (negative = side B),
 * v = distance across from the top sideline. A full court is 18 x 9.
 */
export interface CourtDiagram {
  active: CourtRect[];
  zones: CourtZone[];
  lines: { u: number; v0: number; v1: number; label: string }[];
  /** Players as [u, v, label?]. A and B are the teams, W are waiting players. */
  A: DiagramPoint[];
  B: DiagramPoint[];
  W?: DiagramPoint[];
  coach?: DiagramPoint[];
  arrows: DiagramArrow[];
  caption: string;
}

export interface CourtRect {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

export interface CourtZone extends CourtRect {
  kind: 'score' | 'rule' | 'adapt';
  label?: string;
}

export type DiagramPoint = [number, number, string?];

export type ArrowKind =
  'serve' | 'pass' | 'set' | 'attack' | 'attack2' | 'free' | 'recover' | 'support';

export type DiagramArrow = [number, number, number, number, ArrowKind];

export interface HuddleQuestion {
  concept: TacticalConcept;
  text: string;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                              */
/* ------------------------------------------------------------------ */

/**
 * How a game is scored on the scoreboard. Each mode has its own reducer in
 * core/engine/match.ts. Add a new mode by adding a variant here and a case
 * in the reducer: the UI asks the engine which buttons to show.
 */
export type ScoringConfig = RallyScoring | MonarchScoring | WashScoring;

/** Two teams, points per rally, first to `target`. */
export interface RallyScoring {
  mode: 'rally';
  target: number;
  /** Labels for the two sides, e.g. ["Team A", "Team B"]. */
  sideLabels: [string, string];
  /** Buttons shown under each side. The first one is the default (+1). */
  actions: ScoreAction[];
}

/**
 * King-of-the-court. Side A holds the court (Monarchs), challenger units take
 * turns on side B and must win `winStreak` rallies in a row to take over.
 */
export interface MonarchScoring {
  mode: 'monarch';
  winStreak: number;
  /** How many challenger units queue up (anonymous: "Pair 1", "Pair 2", ...). */
  challengerUnits: number;
  unitLabel: string;
}

/**
 * "Big point, little point": a team scores only by winning both the serve
 * rally and the coach's follow-up ball. A split is a wash (no point).
 */
export interface WashScoring {
  mode: 'wash';
  target: number;
  sideLabels: [string, string];
}

export interface ScoreAction {
  id: string;
  label: string;
  points: number;
}

/* ------------------------------------------------------------------ */
/* Adaptation (modification-by-adaptation, Hopper 2011)                 */
/* ------------------------------------------------------------------ */

/**
 * A rule that switches on when its trigger is met and tells the coach what to
 * change. `kind: 'rotation'` rules are reminders (swap players in, rotate),
 * not handicaps, but they run through the same engine.
 */
export interface AdaptationRule {
  id: string;
  kind: 'adaptation' | 'rotation';
  trigger: Trigger;
  /** Short label for the trigger, as written in the plan ("Lead by 3"). */
  when: string;
  /** What changes, as written in the plan. */
  effect: string;
  /** Even shorter version for alerts and speech (optional). */
  cue?: string;
}

export type Trigger = LeadTrigger | TrailTrigger | StreakTrigger | EveryPointsTrigger;

/** Live during a game: the subject side leads by at least `by`. */
export interface LeadTrigger {
  type: 'lead';
  by: number;
}

/** Live during a game: the subject side trails by at least `by`. */
export interface TrailTrigger {
  type: 'trail';
  by: number;
}

/**
 * The subject has won (or lost) `count` units in a row.
 * Units depend on the scoring mode: whole games, wash points, Monarch
 * defences or challenger attempts.
 */
export interface StreakTrigger {
  type: 'streak';
  outcome: 'win' | 'loss';
  unit: StreakUnit;
  count: number;
  /** Optional: only check one side (e.g. Monarchs are always side A). */
  side?: Side;
}

export type StreakUnit = 'game' | 'wash' | 'defence' | 'attempt';

/** A reminder every `points` points scored by a side (e.g. tag-team swaps). */
export interface EveryPointsTrigger {
  type: 'everyPoints';
  side: Side;
  points: number;
}

/* ------------------------------------------------------------------ */
/* Task cards, tallies, session plans                                    */
/* ------------------------------------------------------------------ */

export interface TaskCard {
  id: string;
  skill: string;
  ican: string;
  phases: TaskCardPhase[];
  task: string;
  score: string;
  video?: { label: string; url: string };
}

export interface TaskCardPhase {
  phase: string;
  cue: string;
  /** Glossary key, e.g. a BIOMECS letter. */
  principle: string;
  why: string;
}

export interface GlossaryEntry {
  key: string;
  name: string;
  text: string;
}

/** A timed observation sheet: tap counters plus a few typed numbers. */
export interface TallySheetTemplate {
  id: string;
  name: string;
  /** Default length of one count, in seconds. */
  durationSec: number;
  instructions: string;
  counters: TallyCounter[];
  /** Ratios worked out from the counters (e.g. attacks dug / attacks faced). */
  derived: DerivedMetric[];
}

export interface TallyCounter {
  key: string;
  label: string;
  /** 'tap' = big +1 button, 'number' = typed value (e.g. players on the side). */
  input: 'tap' | 'number';
  /** For 'max' counters, only the largest typed value is kept (e.g. longest rally). */
  aggregate?: 'sum' | 'max';
}

export interface DerivedMetric {
  key: string;
  label: string;
  numerator: string;
  denominator: string;
  format: 'ratio' | 'percent';
}

export type BlockKind = 'intro' | 'baseline' | 'play' | 'huddle' | 'practice' | 'transfer';

export interface SessionBlock {
  /** Minutes from the start of the plan. */
  startMin: number;
  endMin: number;
  kind: BlockKind;
  text: string;
  /** Game played in this block, if any. */
  gameId?: string;
  /** Task card used in this block, if any. */
  cardId?: string;
  /** Tally sheet suggested in this block, if any. */
  tallySheetId?: string;
  /** Whether the game's adaptation rules are on in this block. */
  adaptationsOn?: boolean;
  /** Huddle question to show on screen. */
  question?: string;
}

export interface SessionPlan {
  id: string;
  number: number;
  title: string;
  goal: string;
  gameId: string;
  cardId: string;
  blocks: SessionBlock[];
  /** What to write down afterwards. */
  record: string[];
}
