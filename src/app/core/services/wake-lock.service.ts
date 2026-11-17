import { Injectable } from '@angular/core';

/** Keeps the screen on during a session, where the browser supports it. */
@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private lock: WakeLockSentinel | null = null;

  async acquire(): Promise<void> {
    if (!('wakeLock' in navigator) || this.lock) return;
    try {
      this.lock = await navigator.wakeLock.request('screen');
      this.lock.addEventListener('release', () => (this.lock = null));
    } catch {
      // Not allowed (e.g. low battery mode). The app still works.
    }
  }

  async release(): Promise<void> {
    await this.lock?.release();
    this.lock = null;
  }
}
