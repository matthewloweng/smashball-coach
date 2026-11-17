/**
 * Tally reducer: works out counter totals and derived ratios for each timed
 * tally run (e.g. a 3-minute contact count).
 */
import { SessionEvent, TallyRunEvent } from '../models/session.models';
import { TallySheetTemplate } from '../models/template.models';
import { effectiveEvents } from './events';

export interface TallyRun {
  runId: string;
  sheetId: string;
  context: string;
  durationSec: number;
  startedAt: number;
  values: Record<string, number>;
}

export interface DerivedValue {
  key: string;
  label: string;
  /** null when the denominator is 0 or missing. */
  value: number | null;
  display: string;
}

export function tallyRuns(
  events: readonly SessionEvent[],
  sheets: readonly TallySheetTemplate[],
): TallyRun[] {
  const runs = new Map<string, TallyRun>();
  const sheetById = new Map(sheets.map((s) => [s.id, s]));
  for (const e of effectiveEvents(events)) {
    if (e.type === 'tally.run') {
      runs.set(e.runId, startRun(e));
    } else if (e.type === 'tally') {
      const run = runs.get(e.runId);
      if (!run) continue;
      const counter = sheetById.get(run.sheetId)?.counters.find((c) => c.key === e.key);
      const current = run.values[e.key] ?? 0;
      let next: number;
      if (e.mode === 'set') {
        next = counter?.aggregate === 'max' ? Math.max(current, e.value) : e.value;
      } else {
        next = Math.max(0, current + e.value);
      }
      run.values = { ...run.values, [e.key]: next };
    }
  }
  return [...runs.values()];
}

function startRun(e: TallyRunEvent): TallyRun {
  return {
    runId: e.runId,
    sheetId: e.sheetId,
    context: e.context,
    durationSec: e.durationSec,
    startedAt: e.at,
    values: {},
  };
}

export function derivedValues(run: TallyRun, sheet: TallySheetTemplate): DerivedValue[] {
  return sheet.derived.map((d) => {
    const num = run.values[d.numerator];
    const den = run.values[d.denominator];
    const value = num !== undefined && den ? num / den : null;
    let display = '–';
    if (value !== null) {
      display = d.format === 'percent' ? `${Math.round(value * 100)}%` : value.toFixed(1);
    }
    return { key: d.key, label: d.label, value, display };
  });
}
