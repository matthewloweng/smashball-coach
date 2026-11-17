import { Injectable, inject, signal } from '@angular/core';
import { KEY_VALUE_STORE } from '../storage/key-value-store';

export interface Settings {
  vibrate: boolean;
  speak: boolean;
  /** Keep the screen awake during a session (where supported). */
  keepAwake: boolean;
}

const DEFAULTS: Settings = { vibrate: true, speak: true, keepAwake: true };
const KEY = 'settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly store = inject(KEY_VALUE_STORE);
  readonly settings = signal<Settings>(DEFAULTS);

  async load(): Promise<void> {
    const saved = await this.store.get<Partial<Settings>>(KEY);
    this.settings.set({ ...DEFAULTS, ...saved });
  }

  async update(patch: Partial<Settings>): Promise<void> {
    const next = { ...this.settings(), ...patch };
    this.settings.set(next);
    await this.store.set(KEY, next);
  }
}
