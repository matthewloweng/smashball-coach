import { Component, computed, effect, inject, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { playSkipForward, play } from 'ionicons/icons';
import { ClockService } from '../../core/services/clock.service';
import { CueService } from '../../core/services/cue.service';
import { SessionStore } from '../../core/services/session.store';
import { BLOCK_LABELS, formatClock } from './session-format';

/** Always-visible strip: the block running now, its countdown, and "Next". */
@Component({
  selector: 'app-block-bar',
  imports: [IonButton, IonIcon],
  template: `
    @if (store.plan(); as plan) {
      <div
        class="bar"
        [class.over]="remaining() !== null && remaining()! < 0"
        [attr.data-kind]="block()?.kind"
      >
        @if (block(); as b) {
          <div class="info">
            <span class="kind">{{ labels[b.kind] }} · {{ b.startMin }}-{{ b.endMin }} min</span>
            <span class="clock" aria-live="off">{{ clock() }}</span>
          </div>
          <ion-button
            (click)="next()"
            [attr.aria-label]="isLast() ? 'Finish practice' : 'Next block'"
          >
            @if (isLast()) {
              Finish
            } @else {
              Next
              <ion-icon slot="end" name="play-skip-forward" />
            }
          </ion-button>
        } @else {
          <div class="info">
            <span class="kind">Ready</span>
            <span class="muted">{{ plan.blocks.length }} blocks · {{ total() }} min</span>
          </div>
          <ion-button (click)="startFirst()">
            <ion-icon slot="start" name="play" />
            Start
          </ion-button>
        }
      </div>
    }
  `,
  styles: `
    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 12px;
      background: var(--team-a-soft);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    .bar[data-kind='huddle'] {
      background: var(--alert-bg);
    }
    .bar[data-kind='practice'] {
      background: var(--rotation-bg);
    }
    .bar.over .clock {
      color: var(--team-b);
    }
    .info {
      display: flex;
      flex-direction: column;
    }
    .kind {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .clock {
      font-size: 2rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }
  `,
})
export class BlockBarComponent {
  protected readonly store = inject(SessionStore);
  private readonly time = inject(ClockService);
  private readonly cues = inject(CueService);
  protected readonly labels = BLOCK_LABELS;

  /** Emitted when the coach taps Finish on the last block. */
  readonly finish = output<void>();

  protected readonly block = this.store.block;

  protected readonly isLast = computed(() => {
    const plan = this.store.plan();
    return !!plan && this.store.blockIndex() >= plan.blocks.length - 1;
  });

  protected readonly total = computed(() => {
    const blocks = this.store.plan()?.blocks ?? [];
    return blocks.length ? blocks[blocks.length - 1]!.endMin - blocks[0]!.startMin : 0;
  });

  /** Seconds left in the block (negative once it runs over). */
  protected readonly remaining = computed(() => {
    const b = this.block();
    const startedAt = this.store.blockStartedAt();
    if (!b || startedAt === null) return null;
    const length = (b.endMin - b.startMin) * 60;
    return Math.ceil(length - (this.time.now() - startedAt) / 1000);
  });

  protected readonly clock = computed(() => {
    const r = this.remaining();
    return r === null ? '' : formatClock(r);
  });

  private cuedFor: number | null = null;

  constructor() {
    addIcons({ playSkipForward, play });
    // One cue when the block's time is up.
    effect(() => {
      const r = this.remaining();
      const startedAt = this.store.blockStartedAt();
      if (r === null || startedAt === null || r > 0 || this.cuedFor === startedAt) return;
      this.cuedFor = startedAt;
      const plan = this.store.plan();
      const next = plan?.blocks[this.store.blockIndex() + 1];
      void this.cues.alert(
        next ? `Time. Next: ${BLOCK_LABELS[next.kind]}` : 'Time. Practice done.',
      );
    });
  }

  protected startFirst(): void {
    void this.store.record({ type: 'block.started', blockIndex: 0 });
  }

  protected next(): void {
    if (this.isLast()) {
      this.finish.emit();
      return;
    }
    void this.store.record({ type: 'block.started', blockIndex: this.store.blockIndex() + 1 });
  }
}
