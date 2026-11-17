import { InjectionToken } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * The only place the app touches device storage. Everything else goes through
 * repositories that depend on this interface, so a cloud-backed store can be
 * swapped in later (Phase 3) without touching features.
 */
export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export const KEY_VALUE_STORE = new InjectionToken<KeyValueStore>('KeyValueStore');

/** Capacitor Preferences: native storage on iOS/Android, localStorage on the web. */
export class PreferencesStore implements KeyValueStore {
  constructor(private readonly prefix = 'smashball:') {}

  async get<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key: this.prefix + key });
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await Preferences.set({ key: this.prefix + key, value: JSON.stringify(value) });
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key: this.prefix + key });
  }
}

/** In-memory store for tests. */
export class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    const v = this.data.get(key);
    return v === undefined ? null : (JSON.parse(v) as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    this.data.delete(key);
  }
}
