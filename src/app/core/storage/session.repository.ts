import { Injectable, inject } from '@angular/core';
import { Session } from '../models/session.models';
import { KEY_VALUE_STORE } from './key-value-store';

/** Light listing entry, so the history screen doesn't load every event log. */
export interface SessionIndexEntry {
  id: string;
  planId: string;
  startedAt: number;
  endedAt?: number;
}

const INDEX_KEY = 'sessions/index';
const sessionKey = (id: string) => `sessions/${id}`;

@Injectable({ providedIn: 'root' })
export class SessionRepository {
  private readonly store = inject(KEY_VALUE_STORE);

  async list(): Promise<SessionIndexEntry[]> {
    const index = (await this.store.get<SessionIndexEntry[]>(INDEX_KEY)) ?? [];
    return [...index].sort((a, b) => b.startedAt - a.startedAt);
  }

  get(id: string): Promise<Session | null> {
    return this.store.get<Session>(sessionKey(id));
  }

  async save(session: Session): Promise<void> {
    await this.store.set(sessionKey(session.id), session);
    const index = (await this.store.get<SessionIndexEntry[]>(INDEX_KEY)) ?? [];
    const entry: SessionIndexEntry = {
      id: session.id,
      planId: session.planId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };
    const next = index.filter((e) => e.id !== session.id).concat(entry);
    await this.store.set(INDEX_KEY, next);
  }

  async delete(id: string): Promise<void> {
    await this.store.remove(sessionKey(id));
    const index = (await this.store.get<SessionIndexEntry[]>(INDEX_KEY)) ?? [];
    await this.store.set(
      INDEX_KEY,
      index.filter((e) => e.id !== id),
    );
  }
}
