import { Component, computed, input } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number | null;
}

/** Small horizontal bar chart, no chart library needed. */
@Component({
  selector: 'app-bar-chart',
  template: `
    <figure>
      <figcaption>{{ title() }}</figcaption>
      @for (d of rows(); track $index) {
        <div class="row">
          <span class="label">{{ d.label }}</span>
          <span class="track">
            <span class="bar" [style.width.%]="d.width"></span>
          </span>
          <span class="value">{{ d.display }}</span>
        </div>
      }
    </figure>
  `,
  styles: `
    figure {
      margin: 0 0 16px;
    }
    figcaption {
      font-weight: 700;
      margin-bottom: 6px;
    }
    .row {
      display: grid;
      grid-template-columns: 42% 1fr 52px;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
      font-size: 0.82rem;
    }
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .track {
      height: 14px;
      background: rgba(127, 127, 127, 0.15);
      border-radius: 7px;
      overflow: hidden;
    }
    .bar {
      display: block;
      height: 100%;
      background: var(--ion-color-primary);
      border-radius: 7px;
    }
    .value {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
    }
  `,
})
export class BarChartComponent {
  readonly title = input.required<string>();
  readonly data = input.required<BarDatum[]>();
  readonly format = input<'ratio' | 'percent'>('ratio');

  protected readonly rows = computed(() => {
    const data = this.data();
    const max = Math.max(
      ...data.map((d) => d.value ?? 0),
      this.format() === 'percent' ? 1 : 0.0001,
    );
    return data.map((d) => ({
      label: d.label,
      width: d.value === null ? 0 : (d.value / max) * 100,
      display:
        d.value === null
          ? '–'
          : this.format() === 'percent'
            ? `${Math.round(d.value * 100)}%`
            : d.value.toFixed(1),
    }));
  });
}
