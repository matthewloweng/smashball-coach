import { Injectable, computed, inject, signal } from '@angular/core';
import { ActiveRule, activeRules, newlyActive } from '../engine/adaptation';
import { effectiveEvents } from '../engine/events';
import { sideLabel } from '../engine/labels';
import { MatchState, replayCourt } from '../engine/match';
import { CourtSetup, NewSessionEvent, Session, SessionEvent } from '../models/session.models';
import { SessionBlock, SessionPlan } from '../models/template.models';
import { KEY_VALUE_STORE } from '../storage/key-value-store';
import { SessionRepository } from '../storage/session.repository';
import { CueService } from './cue.service';
import { newId } from './id';
import { TemplateService } from './template.service';

const ACTIVE_KEY = 'sessions/active';

/** Events the per-court undo button can take back. */
const UNDOABLE = new Set<SessionEvent['type']>([
  'point',
  'wash',
  'monarch.rally',
  'game.ended',
  'levelup.attempt',
  'levelup.change',
]);

/**
 * The live session. Holds the event log in a signal; every view reads
 * computed state derived from it by the pure engine. Saves after each event.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly repo = inject(SessionRepository);
  private readonly store = inject(KEY_VALUE_STORE);
  private readonly templates = inject(TemplateService);
  private readonly cues = inject(CueService);

  readonly session = signal<Session | null>(null);

  readonly plan = computed<SessionPlan | null>(() => {
    const s = this.session();
    return s ? this.templates.plan(s.planId) : null;
  });

  readonly events = computed(() => this.session()?.events ?? []);

  /** Index of the plan block running now (-1 before the first block starts). */
  readonly blockIndex = computed(() => {
    const started = this.events().filter((e) => e.type === 'block.started');
    const last = started[started.length - 1];
    return last && last.type === 'block.started' ? last.blockIndex : -1;
  });

  readonly blockStartedAt = computed(() => {
    const started = this.events().filter((e) => e.type === 'block.started');
    return started[started.length - 1]?.at ?? null;
  });

  readonly block = computed<SessionBlock | null>(
    () => this.plan()?.blocks[this.blockIndex()] ?? null,
  );

  /** Adaptation rules are on in blocks that say so; outside a play block they're on by default. */
  readonly adaptationsOn = computed(() => this.block()?.adaptationsOn ?? true);

  readonly courts = computed<CourtSetup[]>(() => this.session()?.courts ?? []);

  readonly matches = computed(() => {
    const map = new Map<string, MatchState>();
    for (const c of this.courts()) {
      map.set(c.id, replayCourt(c.id, c.gameId, this.events(), this.templates.gameFor));
    }
    return map;
  });

  readonly rules = computed(() => {
    const map = new Map<string, ActiveRule[]>();
    for (const [courtId, m] of this.matches()) {
      map.set(courtId, activeRules(this.templates.game(m.gameId), m, this.adaptationsOn()));
    }
    return map;
  });

  /** Restores a session left running (e.g. after the phone locked or the page reloaded). */
  async restore(): Promise<void> {
    const id = await this.store.get<string>(ACTIVE_KEY);
    if (!id) return;
    const s = await this.repo.get(id);
    if (s && !s.endedAt) this.session.set(s);
  }

  async start(planId: string, courtCount: number): Promise<Session> {
    const plan = this.templates.plan(planId);
    const courts: CourtSetup[] = Array.from({ length: courtCount }, (_, i) => ({
      id: `court-${i + 1}`,
      label: `Court ${i + 1}`,
      gameId: plan.gameId,
    }));
    const session: Session = {
      id: newId(),
      packId: this.templates.pack.id,
      planId,
      startedAt: Date.now(),
      courts,
      events: [],
      notes: '',
    };
    this.session.set(session);
    await this.persist();
    await this.store.set(ACTIVE_KEY, session.id);
    return session;
  }

  /** Appends an event, cues any rule that just switched on, and saves. */
  async record(event: NewSessionEvent): Promise<void> {
    const current = this.session();
    if (!current) return;
    const before = this.rules();
    const stamped = { ...event, id: newId(), at: Date.now() } as SessionEvent;
    this.session.set({ ...current, events: [...current.events, stamped] });
    this.cueNewRules(before);
    await this.persist();
  }

  /** Takes back the last scoring tap on a court. */
  async undo(courtId: string): Promise<void> {
    const live = effectiveEvents(this.events());
    for (let i = live.length - 1; i >= 0; i--) {
      const e = live[i];
      if (e && UNDOABLE.has(e.type) && 'courtId' in e && e.courtId === courtId) {
        await this.record({ type: 'undo', targetId: e.id });
        return;
      }
    }
  }

  async setCourtGame(courtId: string, gameId: string): Promise<void> {
    await this.record({ type: 'court.game', courtId, gameId });
  }

  async addCourt(): Promise<void> {
    const s = this.session();
    const plan = this.plan();
    if (!s || !plan) return;
    const n = s.courts.length + 1;
    this.session.set({
      ...s,
      courts: [...s.courts, { id: `court-${n}`, label: `Court ${n}`, gameId: plan.gameId }],
    });
    await this.persist();
  }

  async setNotes(notes: string): Promise<void> {
    const s = this.session();
    if (!s) return;
    this.session.set({ ...s, notes });
    await this.persist();
  }

  async finish(): Promise<string | null> {
    const s = this.session();
    if (!s) return null;
    this.session.set({ ...s, endedAt: Date.now() });
    await this.persist();
    await this.store.remove(ACTIVE_KEY);
    this.session.set(null);
    return s.id;
  }

  private cueNewRules(before: Map<string, ActiveRule[]>): void {
    const after = this.rules();
    const lines: string[] = [];
    for (const [courtId, rules] of after) {
      const fresh = newlyActive(before.get(courtId) ?? [], rules);
      const court = this.courts().find((c) => c.id === courtId);
      const match = this.matches().get(courtId);
      if (!court || !match) continue;
      const game = this.templates.game(match.gameId);
      for (const r of fresh) {
        const who = sideLabel(game, r.side);
        const where = this.courts().length > 1 ? `${court.label}, ` : '';
        lines.push(`${where}${who}: ${r.rule.cue ?? r.rule.effect}`);
      }
    }
    if (lines.length) void this.cues.alert(lines.join('. '));
  }

  private async persist(): Promise<void> {
    const s = this.session();
    if (s) await this.repo.save(s);
  }
}
