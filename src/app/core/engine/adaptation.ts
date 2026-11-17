/**
 * Adaptation engine (modification-by-adaptation, Hopper 2011).
 *
 * Given a game's rules and the live match state, works out which rules are
 * switched on right now and for which side. The UI shows these as alerts and
 * the cue service vibrates/speaks when one newly switches on.
 */
import { AdaptationRule, GameTemplate, Side, Trigger } from '../models/template.models';
import { MatchState } from './match';

export interface ActiveRule {
  /** Unique per rule and side, used to spot rules that newly switched on. */
  key: string;
  rule: AdaptationRule;
  side: Side;
}

const SIDES: Side[] = ['A', 'B'];

export function triggerMet(trigger: Trigger, side: Side, state: MatchState): boolean {
  const margin = side === 'A' ? state.score.A - state.score.B : state.score.B - state.score.A;
  switch (trigger.type) {
    case 'lead':
      return margin >= trigger.by;
    case 'trail':
      return -margin >= trigger.by;
    case 'streak': {
      if (trigger.side && trigger.side !== side) return false;
      const s = state.streaks[side][trigger.unit];
      if (!s) return false;
      return (trigger.outcome === 'win' ? s.wins : s.losses) >= trigger.count;
    }
    case 'everyPoints': {
      if (trigger.side !== side || !state.lastPoint || state.lastPoint.side !== side) return false;
      const n = trigger.points;
      return Math.floor(state.lastPoint.to / n) > Math.floor(state.lastPoint.from / n);
    }
  }
}

/** All rules switched on for the current state, in the order the game lists them. */
export function activeRules(
  game: GameTemplate,
  state: MatchState,
  adaptationsOn = true,
): ActiveRule[] {
  const out: ActiveRule[] = [];
  for (const rule of game.adaptations) {
    if (rule.kind === 'adaptation' && !adaptationsOn) continue;
    for (const side of SIDES) {
      if (triggerMet(rule.trigger, side, state)) {
        out.push({ key: `${rule.id}:${side}`, rule, side });
      }
    }
  }
  return out;
}

/** Rules active now that were not active before (for one-off cues). */
export function newlyActive(
  before: readonly ActiveRule[],
  after: readonly ActiveRule[],
): ActiveRule[] {
  const seen = new Set(before.map((r) => r.key));
  return after.filter((r) => !seen.has(r.key));
}
