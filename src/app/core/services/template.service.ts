import { Injectable } from '@angular/core';
import { VOLLEYBALL_PACK } from '../../content/volleyball/volleyball.pack';
import {
  GameTemplate,
  LevelTemplate,
  SessionPlan,
  TallySheetTemplate,
  TaskCard,
  TemplatePack,
} from '../models/template.models';

/**
 * Read access to template packs. Phase 1 ships one built-in pack; Phase 2
 * adds imported and user-made packs behind the same methods.
 */
@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly packs: TemplatePack[] = [VOLLEYBALL_PACK];

  /** The pack the app opens with. */
  readonly pack: TemplatePack = VOLLEYBALL_PACK;

  allPacks(): readonly TemplatePack[] {
    return this.packs;
  }

  game(id: string): GameTemplate {
    return this.find(this.pack.games, id, 'game');
  }

  plan(id: string): SessionPlan {
    return this.find(this.pack.sessions, id, 'plan');
  }

  card(id: string): TaskCard {
    return this.find(this.pack.taskCards, id, 'task card');
  }

  sheet(id: string): TallySheetTemplate {
    return this.find(this.pack.tallySheets, id, 'tally sheet');
  }

  level(id: string): LevelTemplate | undefined {
    return this.pack.levels.find((l) => l.id === id);
  }

  /** Bound helper for the pure engine functions. */
  readonly gameFor = (id: string): GameTemplate => this.game(id);

  private find<T extends { id: string }>(items: readonly T[], id: string, what: string): T {
    const item = items.find((i) => i.id === id);
    if (!item) throw new Error(`Unknown ${what}: ${id}`);
    return item;
  }
}
