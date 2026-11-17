import { Injectable, inject } from '@angular/core';
import { CourtSummary, summariseCourt } from '../../core/engine/metrics';
import { DerivedValue, TallyRun, derivedValues, tallyRuns } from '../../core/engine/tally';
import { Session } from '../../core/models/session.models';
import { SessionPlan } from '../../core/models/template.models';
import { TemplateService } from '../../core/services/template.service';
import { SessionRepository } from '../../core/storage/session.repository';

export interface SessionSummary {
  session: Session;
  plan: SessionPlan | null;
  courts: CourtSummary[];
  counts: { run: TallyRun; derived: DerivedValue[] }[];
}

export interface CountPoint {
  label: string;
  startedAt: number;
  values: Record<string, number | null>;
}

/** Builds the reflection evidence from saved sessions. */
@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly repo = inject(SessionRepository);
  private readonly templates = inject(TemplateService);

  async all(): Promise<Session[]> {
    const index = await this.repo.list();
    const sessions = await Promise.all(index.map((e) => this.repo.get(e.id)));
    return sessions.filter((s): s is Session => s !== null);
  }

  summarise(session: Session): SessionSummary {
    const plan = this.planOrNull(session.planId);
    const sheets = this.templates.pack.tallySheets;
    return {
      session,
      plan,
      courts: session.courts.map((c) =>
        summariseCourt(session, c.id, this.templates.gameFor, plan?.blocks ?? []),
      ),
      counts: tallyRuns(session.events, sheets).map((run) => {
        const sheet = sheets.find((s) => s.id === run.sheetId);
        return { run, derived: sheet ? derivedValues(run, sheet) : [] };
      }),
    };
  }

  /** Every contact count across all practices, oldest first, for the comparison chart. */
  countSeries(sessions: readonly Session[]): CountPoint[] {
    const points: CountPoint[] = [];
    for (const s of sessions) {
      const plan = this.planOrNull(s.planId);
      for (const c of this.summarise(s).counts) {
        points.push({
          label: `P${plan?.number ?? '?'} · ${c.run.context}`,
          startedAt: c.run.startedAt,
          values: Object.fromEntries(c.derived.map((d) => [d.key, d.value])),
        });
      }
    }
    return points.sort((a, b) => a.startedAt - b.startedAt);
  }

  /** All sessions as one JSON file, for the reflection or a backup. */
  exportJson(sessions: readonly Session[]): string {
    return JSON.stringify(
      { app: 'smashball-coach', exportedAt: new Date().toISOString(), sessions },
      null,
      2,
    );
  }

  /** Contact counts as CSV, one row per count. */
  exportCountsCsv(sessions: readonly Session[]): string {
    const sheet = this.templates.pack.tallySheets[0];
    if (!sheet) return '';
    const keys = sheet.counters.map((c) => c.key);
    const derived = sheet.derived.map((d) => d.key);
    const rows = [['practice', 'date', 'context', ...keys, ...derived].join(',')];
    for (const s of sessions) {
      const plan = this.planOrNull(s.planId);
      for (const c of this.summarise(s).counts) {
        const d = Object.fromEntries(c.derived.map((x) => [x.key, x.value]));
        rows.push(
          [
            plan?.number ?? '',
            new Date(c.run.startedAt).toISOString().slice(0, 10),
            `"${c.run.context.replace(/"/g, '""')}"`,
            ...keys.map((k) => c.run.values[k] ?? 0),
            ...derived.map((k) =>
              d[k] === null || d[k] === undefined ? '' : Number(d[k]).toFixed(3),
            ),
          ].join(','),
        );
      }
    }
    return rows.join('\n');
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }

  private planOrNull(id: string): SessionPlan | null {
    try {
      return this.templates.plan(id);
    } catch {
      return null;
    }
  }
}
