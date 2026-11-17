import { TestBed } from '@angular/core/testing';
import { KEY_VALUE_STORE, MemoryStore } from '../storage/key-value-store';
import { SessionRepository } from '../storage/session.repository';
import { CueService } from './cue.service';
import { SessionStore } from './session.store';

describe('SessionStore', () => {
  let store: SessionStore;
  let repo: SessionRepository;
  const spoken: string[] = [];

  beforeEach(() => {
    spoken.length = 0;
    TestBed.configureTestingModule({
      providers: [
        { provide: KEY_VALUE_STORE, useValue: new MemoryStore() },
        {
          provide: CueService,
          useValue: {
            alert: async (s?: string) => void spoken.push(s ?? ''),
            tap: async () => undefined,
          },
        },
      ],
    });
    store = TestBed.inject(SessionStore);
    repo = TestBed.inject(SessionRepository);
  });

  it('starts a practice with one court per lane, all on the plan game', async () => {
    const s = await store.start('p2', 3);
    expect(s.courts.map((c) => c.gameId)).toEqual(['g2', 'g2', 'g2']);
    expect(store.plan()?.number).toBe(2);
    expect(await repo.get(s.id)).not.toBeNull();
  });

  it('scores, cues new adaptation rules once, and undoes the last tap', async () => {
    await store.start('p2', 1);
    await store.record({ type: 'block.started', blockIndex: 3 }); // play block with adaptations on
    for (let i = 0; i < 3; i++) {
      await store.record({
        type: 'point',
        courtId: 'court-1',
        side: 'A',
        actionId: 'point',
        points: 1,
      });
    }
    expect(store.matches().get('court-1')?.score).toEqual({ A: 3, B: 0 });
    expect(spoken).toHaveLength(1);
    expect(spoken[0]).toContain('Pair A: Short zone scores 1');

    await store.record({
      type: 'point',
      courtId: 'court-1',
      side: 'A',
      actionId: 'point',
      points: 1,
    });
    expect(spoken).toHaveLength(1); // no repeat while the rule stays on

    await store.undo('court-1');
    expect(store.matches().get('court-1')?.score).toEqual({ A: 3, B: 0 });
  });

  it('turns adaptation rules off in blocks that say so', async () => {
    await store.start('p2', 1);
    await store.record({ type: 'block.started', blockIndex: 0 }); // first play block: adaptations off
    expect(store.adaptationsOn()).toBe(false);
    for (let i = 0; i < 3; i++) {
      await store.record({
        type: 'point',
        courtId: 'court-1',
        side: 'A',
        actionId: 'point',
        points: 1,
      });
    }
    expect(store.rules().get('court-1')).toEqual([]);
    expect(spoken).toHaveLength(0);
  });

  it('finishes and saves, then restores nothing', async () => {
    const s = await store.start('p1', 2);
    const id = await store.finish();
    expect(id).toBe(s.id);
    expect(store.session()).toBeNull();
    expect((await repo.get(s.id))?.endedAt).toBeDefined();
    await store.restore();
    expect(store.session()).toBeNull();
  });
});
