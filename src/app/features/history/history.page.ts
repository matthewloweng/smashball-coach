import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, copyOutline, download } from 'ionicons/icons';
import { Session } from '../../core/models/session.models';
import { TemplateService } from '../../core/services/template.service';
import { BarChartComponent, BarDatum } from '../../shared/components/bar-chart.component';
import { downloadText } from '../../shared/download';
import { HistoryService } from './history.service';

@Component({
  selector: 'app-history',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonButton,
    IonIcon,
    RouterLink,
    DatePipe,
    BarChartComponent,
  ],
  templateUrl: './history.page.html',
  styles: `
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: calc(100% - 24px);
      text-align: left;
      color: inherit;
      font: inherit;
      border: none;
    }
    .row strong,
    .row span span {
      display: block;
    }
    .row .tag {
      margin-right: 6px;
      display: inline-block;
      padding: 1px 8px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      vertical-align: middle;
      background: var(--alert-bg);
      color: var(--alert-text);
      border: 1px solid var(--alert-border);
    }
    .small {
      font-size: 0.82rem;
      margin: 0 0 10px;
    }
    .empty {
      text-align: center;
      padding: 32px 24px;
    }
    .exports {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      padding: 8px 12px 32px;
    }
  `,
})
export class HistoryPage implements ViewWillEnter {
  private readonly history = inject(HistoryService);
  private readonly templates = inject(TemplateService);
  protected readonly sessions = signal<Session[]>([]);
  protected readonly loaded = signal(false);
  protected readonly metrics = this.templates.pack.tallySheets[0]?.derived ?? [];

  protected readonly series = computed(() => this.history.countSeries(this.sessions()));
  protected readonly hasSamples = computed(() => this.sessions().some((s) => s.sample));

  constructor() {
    addIcons({ chevronForward, download, copyOutline });
  }

  async ionViewWillEnter(): Promise<void> {
    this.sessions.set(await this.history.all());
    this.loaded.set(true);
  }

  protected planTitle(s: Session): string {
    try {
      const p = this.templates.plan(s.planId);
      return `Practice ${p.number} · ${p.title}`;
    } catch {
      return 'Practice';
    }
  }

  protected chart(key: string): BarDatum[] {
    return this.series().map((p) => ({ label: p.label, value: p.values[key] ?? null }));
  }

  protected exportCsv(): void {
    downloadText(
      'smashball-contact-counts.csv',
      this.history.exportCountsCsv(this.sessions()),
      'text/csv',
    );
  }

  protected readonly copied = signal(false);

  /** Copy works where downloads are blocked (e.g. inside an embedded viewer). */
  protected async copyCsv(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.history.exportCountsCsv(this.sessions()));
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }

  protected exportJson(): void {
    downloadText(
      'smashball-sessions.json',
      this.history.exportJson(this.sessions()),
      'application/json',
    );
  }
}
