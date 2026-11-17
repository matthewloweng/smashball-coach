import { Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CourtDiagram } from '../../core/models/template.models';
import { drawCourt } from './court-diagram';

/** Court diagram with its caption. The SVG is built from escaped template data. */
@Component({
  selector: 'app-court-diagram',
  template: `
    <figure>
      <div class="svg" [innerHTML]="svg()"></div>
      <figcaption>{{ diagram().caption }}</figcaption>
    </figure>
  `,
  encapsulation: ViewEncapsulation.None,
  styles: `
    app-court-diagram figure {
      margin: 0;
    }
    app-court-diagram figcaption {
      font-size: 0.85rem;
      color: var(--muted);
      margin-top: 4px;
    }
    app-court-diagram svg {
      width: 100%;
      height: auto;
      display: block;
    }
    app-court-diagram .floor {
      fill: #e8edf3;
      stroke: #b9c4d2;
    }
    app-court-diagram .active {
      fill: #dce8f7;
    }
    app-court-diagram .active-line {
      fill: none;
      stroke: #1f5aa6;
      stroke-width: 2;
    }
    app-court-diagram .zone-score {
      fill: #f2b70533;
      stroke: #f2b705;
      stroke-dasharray: 3 3;
    }
    app-court-diagram .zone-rule {
      fill: #d4520f22;
    }
    app-court-diagram .hatch-bg {
      fill: #dce8f7;
    }
    app-court-diagram .hatch-line {
      stroke: #c9d6e6;
      stroke-width: 4;
    }
    app-court-diagram .zone-label {
      font-size: 9px;
      fill: #142030;
    }
    app-court-diagram .mark {
      stroke: #1f5aa6;
      stroke-dasharray: 5 4;
    }
    app-court-diagram .dim {
      font-size: 9px;
      fill: #566375;
    }
    app-court-diagram .net {
      stroke: #142030;
      stroke-width: 4;
    }
    app-court-diagram .pA {
      fill: #1f5aa6;
    }
    app-court-diagram .pB {
      fill: #d4520f;
    }
    app-court-diagram .pW {
      fill: #8a96a6;
    }
    app-court-diagram .pC {
      fill: #2b8a3e;
    }
    app-court-diagram .dot-label {
      font-size: 9px;
      fill: #fff;
      font-weight: 700;
    }
    app-court-diagram .arr {
      fill: none;
      stroke: #566375;
      stroke-width: 1.6;
    }
    app-court-diagram .arr-serve,
    app-court-diagram .arr-free {
      stroke-dasharray: 6 4;
    }
    app-court-diagram .arr-recover,
    app-court-diagram .arr-support {
      stroke-dasharray: 2 3;
      stroke: #8a96a6;
    }
    app-court-diagram .arr-set {
      stroke-dasharray: 1 3;
      stroke-linecap: round;
      stroke-width: 2.2;
    }
    app-court-diagram .arr-attack,
    app-court-diagram .arr-attack2 {
      stroke: #d4520f;
      stroke-width: 2.6;
    }
    app-court-diagram .arr-attack2 {
      stroke-dasharray: 8 4;
    }
    app-court-diagram .arrowhead {
      fill: #566375;
    }
    app-court-diagram .arrowhead-atk {
      fill: #d4520f;
    }
  `,
})
export class CourtDiagramComponent {
  readonly diagram = input.required<CourtDiagram>();
  private readonly sanitizer = inject(DomSanitizer);

  // Safe: drawCourt escapes every string that comes from template data.
  protected readonly svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(drawCourt(this.diagram())),
  );
}
