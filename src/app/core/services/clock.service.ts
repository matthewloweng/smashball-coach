import { Injectable, OnDestroy, signal } from '@angular/core';

/**
 * A ticking "now" signal. Timers are always worked out from timestamps, never
 * by counting ticks, so they stay right if the phone locks or the app sleeps.
 */
@Injectable({ providedIn: 'root' })
export class ClockService implements OnDestroy {
  readonly now = signal(Date.now());
  private readonly handle = setInterval(() => this.now.set(Date.now()), 500);

  ngOnDestroy(): void {
    clearInterval(this.handle);
  }
}
