import { Component, computed, inject, signal } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkmark, close, remove } from 'ionicons/icons';
import { LevelAdvice, NEEDED, WINDOW, unitProgress } from '../../core/engine/levelup';
import { CueService } from '../../core/services/cue.service';
import { SessionStore } from '../../core/services/session.store';
import { TemplateService } from '../../core/services/template.service';

const ADVICE: Record<LevelAdvice, string> = {
  up: 'Level up: remove an aid or add a harder constraint',
  down: 'Struggling: give an aid back',
  stay: 'Stay at this level',
  collecting: 'Keep going',
};

/** Tracks each pair or trio against the 2-out-of-3 level-up rule. */
@Component({
  selector: 'app-levels-tab',
  imports: [IonButton, IonIcon],
  templateUrl: './levels-tab.component.html',
  styleUrl: './levels-tab.component.scss',
})
export class LevelsTabComponent {
  private readonly store = inject(SessionStore);
  private readonly templates = inject(TemplateService);
  private readonly cues = inject(CueService);

  protected readonly advice = ADVICE;
  protected readonly rule = `${NEEDED} of the last ${WINDOW} serve-receives end in a third-contact attack`;
  protected readonly courts = this.store.courts;
  protected readonly courtId = signal<string | null>(null);
  protected readonly unitCount = signal(4);

  protected readonly selectedCourt = computed(() => this.courtId() ?? this.courts()[0]?.id ?? null);

  protected readonly unitLabel = computed(() => {
    const id = this.selectedCourt();
    const match = id ? this.store.matches().get(id) : undefined;
    const game = match ? this.templates.game(match.gameId) : null;
    if (!game) return 'Unit';
    if (game.scoring.mode === 'monarch') return game.scoring.unitLabel;
    return /\b2v2\b/.test(game.format) ? 'Pair' : /\b3v3\b/.test(game.format) ? 'Trio' : 'Team';
  });

  protected readonly units = computed(() => {
    const courtId = this.selectedCourt();
    if (!courtId) return [];
    const names = Array.from(
      { length: this.unitCount() },
      (_, i) => `${this.unitLabel()} ${i + 1}`,
    );
    return unitProgress(this.store.events(), courtId, names).slice(0, this.unitCount());
  });

  constructor() {
    addIcons({ checkmark, close, add, remove });
  }

  protected attempt(unit: string, success: boolean): void {
    const courtId = this.selectedCourt();
    if (!courtId) return;
    void this.cues.tap();
    void this.store.record({ type: 'levelup.attempt', courtId, unit, success });
  }

  protected change(unit: string, direction: 'up' | 'down'): void {
    const courtId = this.selectedCourt();
    if (!courtId) return;
    void this.store.record({ type: 'levelup.change', courtId, unit, direction });
  }

  protected setUnits(delta: number): void {
    this.unitCount.update((n) => Math.min(8, Math.max(1, n + delta)));
  }

  protected slots(recent: readonly boolean[]): (boolean | null)[] {
    return Array.from({ length: WINDOW }, (_, i) => recent[i] ?? null);
  }
}
