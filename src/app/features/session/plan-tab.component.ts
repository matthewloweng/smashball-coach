import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular';
import { SessionStore } from '../../core/services/session.store';
import { TemplateService } from '../../core/services/template.service';
import { BLOCK_LABELS } from './session-format';

/** The practice plan: what to do now, in big type, and the full timeline. */
@Component({
  selector: 'app-plan-tab',
  imports: [IonButton, RouterLink],
  template: `
    @if (store.plan(); as plan) {
      @if (store.block(); as b) {
        <div class="card now" [attr.data-kind]="b.kind">
          <p class="section-title flush">Now · {{ labels[b.kind] }}</p>
          @if (!(b.kind === 'huddle' && b.question)) {
            <p class="lead">{{ b.text }}</p>
          }

          @if (b.kind === 'huddle' && b.question) {
            <p class="question">“{{ b.question }}”</p>
            @if (game(); as g) {
              <p class="muted small">Other questions for {{ g.code }}:</p>
              <ul class="small">
                @for (q of g.huddleQuestions; track q.text) {
                  @if (q.text !== b.question) {
                    <li>
                      <strong>{{ q.concept }}:</strong> {{ q.text }}
                    </li>
                  }
                }
              </ul>
            }
          }

          @if (b.kind === 'practice' && card(); as c) {
            <h3>{{ c.skill }}</h3>
            <p class="muted small">{{ c.ican }}. Pick one cue the game exposed.</p>
            <ul class="cues">
              @for (p of c.phases; track p.phase) {
                <li>
                  <span class="principle" [title]="glossary(p.principle)">{{ p.principle }}</span>
                  <span
                    ><strong>{{ p.phase }}:</strong> {{ p.cue }}</span
                  >
                </li>
              }
            </ul>
            <p class="small"><strong>Assessment:</strong> {{ c.task }}</p>
          }

          @if (b.kind === 'play' && game(); as g) {
            <p class="small">
              <strong>{{ g.code }} {{ g.name }}</strong> · Adaptation rules
              {{ b.adaptationsOn ? 'on' : 'off' }}
            </p>
            <div class="row">
              <ion-button size="small" (click)="goTo.emit('courts')">Open scoreboards</ion-button>
              <ion-button size="small" fill="outline" [routerLink]="['/games', g.id]"
                >Rules</ion-button
              >
            </div>
          }

          @if (b.tallySheetId) {
            <ion-button size="small" fill="outline" (click)="goTo.emit('count')"
              >Start a contact count</ion-button
            >
          }
        </div>
      }

      <p class="section-title">Practice {{ plan.number }} · {{ plan.title }}</p>
      <p class="goal muted">{{ plan.goal }}</p>
      <ol class="timeline">
        @for (b of plan.blocks; track $index) {
          <li
            [class.current]="$index === store.blockIndex()"
            [class.done]="$index < store.blockIndex()"
          >
            <button (click)="jump($index)">
              <span class="time">{{ b.startMin }}-{{ b.endMin }}</span>
              <span>
                <strong>{{ labels[b.kind] }}</strong>
                <span class="small">{{ b.text }}</span>
              </span>
            </button>
          </li>
        }
      </ol>

      <p class="section-title">Record afterwards</p>
      <ul class="record small">
        @for (r of plan.record; track r) {
          <li>{{ r }}</li>
        }
      </ul>
    }
  `,
  styles: `
    .now .lead {
      font-size: 1.05rem;
      margin: 4px 0 8px;
    }
    .flush {
      margin: 0;
    }
    .question {
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1.25;
      margin: 8px 0;
    }
    .small {
      font-size: 0.88rem;
    }
    h3 {
      margin: 8px 0 2px;
      font-size: 1.05rem;
      font-weight: 700;
    }
    .cues {
      list-style: none;
      padding: 0;
      margin: 8px 0;
    }
    .cues li {
      display: flex;
      gap: 10px;
      padding: 6px 0;
      border-top: 1px solid rgba(127, 127, 127, 0.15);
      font-size: 0.92rem;
    }
    .principle {
      flex: 0 0 26px;
      height: 26px;
      border-radius: 6px;
      display: grid;
      place-items: center;
      font-weight: 800;
      background: var(--team-a-soft);
      color: var(--team-a);
    }
    .row {
      display: flex;
      gap: 6px;
    }
    .goal {
      margin: 0 16px;
      font-size: 0.9rem;
    }
    .timeline {
      list-style: none;
      padding: 0 12px;
      margin: 8px 0;
    }
    .timeline button {
      all: unset;
      display: flex;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      border-radius: 10px;
      cursor: pointer;
    }
    .timeline .time {
      flex: 0 0 52px;
      font-variant-numeric: tabular-nums;
      color: var(--muted);
      font-size: 0.85rem;
    }
    .timeline strong,
    .timeline .small {
      display: block;
    }
    .timeline .current button {
      background: var(--team-a-soft);
      outline: 2px solid var(--ion-color-primary);
    }
    .timeline .done {
      opacity: 0.55;
    }
    .record {
      margin: 4px 16px 24px;
      padding-left: 18px;
    }
  `,
})
export class PlanTabComponent {
  protected readonly store = inject(SessionStore);
  private readonly templates = inject(TemplateService);
  protected readonly labels = BLOCK_LABELS;

  /** Asks the session page to switch tab. */
  readonly goTo = output<'courts' | 'count'>();

  protected readonly game = computed(() => {
    const id = this.store.block()?.gameId ?? this.store.plan()?.gameId;
    return id ? this.templates.game(id) : null;
  });

  protected readonly card = computed(() => {
    const id = this.store.block()?.cardId;
    return id ? this.templates.card(id) : null;
  });

  protected glossary(key: string): string {
    const g = this.templates.pack.glossary.find((e) => e.key === key);
    return g ? `${g.name}: ${g.text}` : key;
  }

  protected jump(index: number): void {
    if (index === this.store.blockIndex()) return;
    void this.store.record({ type: 'block.started', blockIndex: index });
  }
}
