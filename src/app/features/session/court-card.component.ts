import { Component, computed, inject, input } from '@angular/core';
import { IonButton, IonIcon, IonSelect, IonSelectOption } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowUndo, flag } from 'ionicons/icons';
import { sideLabel, unitName } from '../../core/engine/labels';
import { monarchTarget, targetReached } from '../../core/engine/match';
import { CueService } from '../../core/services/cue.service';
import { SessionStore } from '../../core/services/session.store';
import { TemplateService } from '../../core/services/template.service';
import { ScoreAction, Side } from '../../core/models/template.models';

/** One court's scoreboard with live adaptation alerts. */
@Component({
  selector: 'app-court-card',
  imports: [IonButton, IonIcon, IonSelect, IonSelectOption],
  templateUrl: './court-card.component.html',
  styleUrl: './court-card.component.scss',
})
export class CourtCardComponent {
  readonly courtId = input.required<string>();

  private readonly store = inject(SessionStore);
  private readonly templates = inject(TemplateService);
  private readonly cues = inject(CueService);
  protected readonly games = this.templates.pack.games;
  protected readonly sides: Side[] = ['A', 'B'];

  protected readonly court = computed(() =>
    this.store.courts().find((c) => c.id === this.courtId()),
  );
  protected readonly match = computed(() => this.store.matches().get(this.courtId()));
  protected readonly game = computed(() => {
    const m = this.match();
    return m ? this.templates.game(m.gameId) : null;
  });
  protected readonly rules = computed(() => this.store.rules().get(this.courtId()) ?? []);
  protected readonly adaptationsOn = this.store.adaptationsOn;

  protected readonly winner = computed(() => {
    const m = this.match();
    const g = this.game();
    return m && g ? targetReached(m, g.scoring) : null;
  });

  protected readonly monarch = computed(() => {
    const m = this.match()?.monarch;
    const g = this.game();
    if (!m || !g || g.scoring.mode !== 'monarch') return null;
    const label = g.scoring.unitLabel;
    return {
      monarch: unitName(label, m.monarch),
      challenger: unitName(label, m.challenger),
      next: m.queue.map((i) => unitName(label, i)).join(', '),
      dots: Array.from({ length: monarchTarget(g.scoring, m) }, (_, i) => i < m.progress),
      crowns: m.crowns.map((c, i) => ({ unit: unitName(label, i), crowns: c })),
      defences: m.defences,
    };
  });

  protected readonly actions = computed<ScoreAction[]>(() => {
    const g = this.game();
    return g?.scoring.mode === 'rally' ? g.scoring.actions : [];
  });

  protected readonly target = computed(() => {
    const g = this.game();
    return g && g.scoring.mode !== 'monarch' ? g.scoring.target : null;
  });

  constructor() {
    addIcons({ arrowUndo, flag });
  }

  protected label(side: Side): string {
    const g = this.game();
    return g ? sideLabel(g, side) : side;
  }

  protected score(side: Side): number {
    return this.match()?.score[side] ?? 0;
  }

  protected point(side: Side, action: ScoreAction): void {
    void this.cues.tap();
    void this.store.record({
      type: 'point',
      courtId: this.courtId(),
      side,
      actionId: action.id,
      points: action.points,
    });
  }

  protected wash(winner: Side | 'split'): void {
    void this.cues.tap();
    void this.store.record({ type: 'wash', courtId: this.courtId(), winner });
  }

  protected rally(winner: Side): void {
    void this.cues.tap();
    void this.store.record({ type: 'monarch.rally', courtId: this.courtId(), winner });
  }

  protected endGame(): void {
    void this.store.record({ type: 'game.ended', courtId: this.courtId() });
  }

  protected undo(): void {
    void this.store.undo(this.courtId());
  }

  protected changeGame(gameId: string): void {
    if (gameId !== this.match()?.gameId) void this.store.setCourtGame(this.courtId(), gameId);
  }
}
