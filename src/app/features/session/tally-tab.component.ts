import { Component, computed, effect, inject, signal } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, remove, stopwatch } from 'ionicons/icons';
import { TallyRun, derivedValues, tallyRuns } from '../../core/engine/tally';
import { ClockService } from '../../core/services/clock.service';
import { CueService } from '../../core/services/cue.service';
import { newId } from '../../core/services/id';
import { SessionStore } from '../../core/services/session.store';
import { TemplateService } from '../../core/services/template.service';
import { TallyCounter } from '../../core/models/template.models';
import { formatClock } from './session-format';

/**
 * Tally counts: a timed contact count or an untimed GPAI observation. Big tap
 * counters, then the ratios for the reflection.
 */
@Component({
  selector: 'app-tally-tab',
  imports: [IonButton, IonIcon],
  templateUrl: './tally-tab.component.html',
  styleUrl: './tally-tab.component.scss',
})
export class TallyTabComponent {
  private readonly store = inject(SessionStore);
  private readonly templates = inject(TemplateService);
  private readonly time = inject(ClockService);
  private readonly cues = inject(CueService);

  protected readonly sheets = this.templates.pack.tallySheets;
  protected readonly sheetId = signal(this.sheets[0]!.id);
  protected readonly sheet = computed(() => this.templates.sheet(this.sheetId()));
  protected readonly taps = computed(() => this.sheet().counters.filter((c) => c.input === 'tap'));
  protected readonly numbers = computed(() =>
    this.sheet().counters.filter((c) => c.input === 'number'),
  );

  /** Suggested labels for what is being watched. */
  protected readonly contexts = computed(() => {
    if (this.sheetId() === 'gpai') {
      return ['Coach, before block', 'Coach, after block', 'Player observer', 'Class totals'];
    }
    const plan = this.store.plan();
    const code = plan ? this.templates.game(plan.gameId).code : 'Game';
    return ['6v6 baseline', `${code} small-sided`, '6v6 midpoint', '6v6 end of unit'];
  });

  protected readonly context = signal<string | null>(null);

  /** Counts on the selected sheet, oldest first. */
  protected readonly runs = computed(() =>
    tallyRuns(this.store.events(), this.sheets).filter((r) => r.sheetId === this.sheetId()),
  );
  protected readonly run = computed(() => {
    const runs = this.runs();
    return runs[runs.length - 1] ?? null;
  });

  /** Seconds left in a timed count; null for untimed sheets such as the GPAI. */
  protected readonly remaining = computed(() => {
    const r = this.run();
    if (!r || r.durationSec <= 0) return null;
    return Math.ceil(r.durationSec - (this.time.now() - r.startedAt) / 1000);
  });

  protected readonly clock = computed(() => {
    const r = this.remaining();
    return r === null ? '' : r > 0 ? formatClock(r) : 'Done';
  });

  protected readonly derived = computed(() => {
    const r = this.run();
    return r ? derivedValues(r, this.sheet()) : [];
  });

  /** One line for an earlier count: the ratios worked out for it. */
  protected summary(run: TallyRun): string {
    return derivedValues(run, this.sheet())
      .map((d) => `${d.label} ${d.display}`)
      .join(' · ');
  }

  protected selectSheet(id: string): void {
    if (id === this.sheetId()) return;
    this.sheetId.set(id);
    this.context.set(null);
  }

  private cuedRun: string | null = null;

  constructor() {
    addIcons({ add, remove, stopwatch });
    // Pick a sensible default label from the block running now.
    effect(() => {
      const kind = this.store.block()?.kind;
      const contexts = this.contexts();
      if (this.context() !== null) return;
      if (this.sheetId() !== 'contact-count') {
        this.context.set(contexts[0]!);
        return;
      }
      const [baseline, small, mid, end] = contexts;
      const plan = this.store.plan()?.number ?? 1;
      this.context.set(
        kind === 'transfer' ? (plan >= 6 ? end! : mid!) : kind === 'play' ? small! : baseline!,
      );
    });
    effect(() => {
      const r = this.run();
      const left = this.remaining();
      if (!r || left === null || left > 0 || this.cuedRun === r.runId) return;
      this.cuedRun = r.runId;
      // Only cue counts that ran out while the app was open.
      if (left > -5) void this.cues.alert('Count done');
    });
  }

  protected value(key: string): number {
    return this.run()?.values[key] ?? 0;
  }

  protected startRun(): void {
    const context = this.context() ?? this.contexts()[0]!;
    const runId = newId();
    this.cuedRun = null;
    void this.store.record({
      type: 'tally.run',
      runId,
      sheetId: this.sheet().id,
      context,
      durationSec: this.sheet().durationSec,
    });
  }

  protected tap(counter: TallyCounter, delta: 1 | -1): void {
    const r = this.run();
    if (!r) return;
    if (delta > 0) void this.cues.tap();
    void this.store.record({
      type: 'tally',
      runId: r.runId,
      key: counter.key,
      value: delta,
      mode: 'add',
    });
  }

  protected setNumber(counter: TallyCounter, delta: 1 | -1): void {
    const r = this.run();
    if (!r) return;
    const next = Math.max(0, this.value(counter.key) + delta);
    void this.store.record({
      type: 'tally',
      runId: r.runId,
      key: counter.key,
      value: next,
      mode: 'set',
    });
  }
}
