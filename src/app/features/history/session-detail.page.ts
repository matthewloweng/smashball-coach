import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe, PercentPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { sideLabel } from '../../core/engine/labels';
import { TemplateService } from '../../core/services/template.service';
import { HistoryService, SessionSummary } from './history.service';

@Component({
  selector: 'app-session-detail',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonButton,
    DatePipe,
    PercentPipe,
  ],
  templateUrl: './session-detail.page.html',
  styles: `
    .sample-note {
      border-left: 5px solid var(--alert-border);
      background: var(--alert-bg);
      color: var(--alert-text);
    }
    h2 {
      margin: 0 0 6px;
      font-size: 1.1rem;
      font-weight: 800;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    th,
    td {
      text-align: left;
      padding: 6px 4px;
      border-top: 1px solid rgba(127, 127, 127, 0.15);
    }
    th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
      border-top: none;
    }
    td.num,
    th.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin: 8px 0;
    }
    .stats div {
      background: var(--team-a-soft);
      border-radius: 10px;
      padding: 8px 10px;
    }
    .stats strong {
      display: block;
      font-size: 1.4rem;
    }
    .notes {
      white-space: pre-wrap;
    }
    .danger {
      display: flex;
      justify-content: center;
      padding: 8px 0 32px;
    }
  `,
})
export class SessionDetailPage implements ViewWillEnter {
  readonly id = input.required<string>();
  private readonly history = inject(HistoryService);
  private readonly templates = inject(TemplateService);
  private readonly alerts = inject(AlertController);
  private readonly router = inject(Router);

  protected readonly summary = signal<SessionSummary | null>(null);
  protected readonly missing = signal(false);

  protected readonly title = computed(() => {
    const p = this.summary()?.plan;
    return p ? `Practice ${p.number}` : 'Practice';
  });

  async ionViewWillEnter(): Promise<void> {
    const s = await this.history.get(this.id());
    if (!s) {
      this.missing.set(true);
      return;
    }
    this.summary.set(this.history.summarise(s));
  }

  protected gameName(id: string): string {
    const g = this.templates.game(id);
    return `${g.code}`;
  }

  protected winnerLabel(gameId: string, winner: 'A' | 'B' | null): string {
    return winner ? sideLabel(this.templates.game(gameId), winner) : 'Tie';
  }

  protected async remove(): Promise<void> {
    const confirm = await this.alerts.create({
      header: 'Delete this practice?',
      message: 'Its scores, counts and notes are removed from this phone. This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive' },
      ],
    });
    await confirm.present();
    const { role } = await confirm.onDidDismiss();
    if (role !== 'destructive') return;
    await this.history.delete(this.id());
    await this.router.navigateByUrl('/history', { replaceUrl: true });
  }
}
