import { Component, computed, inject, input } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TemplateService } from '../../core/services/template.service';
import { CourtDiagramComponent } from '../../shared/components/court-diagram.component';

/** Everything about one game: diagram, REAR design, rules, adaptations, questions. */
@Component({
  selector: 'app-game',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    CourtDiagramComponent,
  ],
  templateUrl: './game.page.html',
  styles: `
    h2 {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0 0 4px;
    }
    .meta {
      font-size: 0.9rem;
      margin: 0 0 8px;
    }
    dl {
      margin: 0;
    }
    dt {
      font-weight: 700;
      margin-top: 8px;
    }
    dd {
      margin: 2px 0 0;
    }
    ul {
      padding-left: 18px;
      margin: 4px 0;
    }
    li {
      margin: 4px 0;
    }
    .rule {
      display: grid;
      grid-template-columns: 38% 1fr;
      gap: 8px;
      padding: 8px 0;
      border-top: 1px solid rgba(127, 127, 127, 0.15);
    }
    .rule strong {
      font-size: 0.9rem;
    }
  `,
})
export class GamePage {
  /** Bound from the route parameter. */
  readonly id = input.required<string>();
  private readonly templates = inject(TemplateService);

  protected readonly game = computed(() => this.templates.game(this.id()));
  protected readonly level = computed(() => this.templates.level(this.game().levelId));
  protected readonly adaptations = computed(() =>
    this.game().adaptations.filter((a) => a.kind === 'adaptation'),
  );
  protected readonly rotations = computed(() =>
    this.game().adaptations.filter((a) => a.kind === 'rotation'),
  );
}
