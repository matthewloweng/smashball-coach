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
import { CountPoint, HistoryService } from './history.service';

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
  protected readonly sheets = this.templates.pack.tallySheets;

  /** One chart group per tally sheet (contact counts, GPAI) that has counts. */
  protected readonly charts = computed(() =>
    this.sheets
      .map((sheet) => {
        const series = this.history.countSeries(this.sessions(), sheet.id);
        return { sheet, series, hasSamples: series.some((p) => p.sample) };
      })
      .filter((c) => c.series.length > 0),
  );

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

  protected chart(series: readonly CountPoint[], key: string): BarDatum[] {
    return series.map((p) => ({ label: p.label, value: p.values[key] ?? null }));
  }

  protected exportCsv(sheetId: string): void {
    const name = sheetId === 'contact-count' ? 'contact-counts' : sheetId;
    downloadText(
      `smashball-${name}.csv`,
      this.history.exportCountsCsv(this.sessions(), sheetId),
      'text/csv',
    );
  }

  /** The sheet whose CSV was just copied, for the button label. */
  protected readonly copied = signal<string | null>(null);

  /** Copy works where downloads are blocked (e.g. inside an embedded viewer). */
  protected async copyCsv(sheetId: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.history.exportCountsCsv(this.sessions(), sheetId));
      this.copied.set(sheetId);
      setTimeout(() => this.copied.set(null), 2000);
    } catch {
      this.copied.set(null);
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
