import { Injectable, inject } from '@angular/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { SettingsService } from './settings.service';

/**
 * Courtside cues, so the coach can keep eyes on the players: a vibration and
 * a short spoken line when a block ends or an adaptation rule switches on.
 */
@Injectable({ providedIn: 'root' })
export class CueService {
  private readonly settings = inject(SettingsService);

  async alert(spoken?: string): Promise<void> {
    const s = this.settings.settings();
    if (s.vibrate) {
      try {
        await Haptics.notification({ type: NotificationType.Warning });
      } catch {
        navigator.vibrate?.([120, 60, 120]);
      }
    }
    if (s.speak && spoken) this.speak(spoken);
  }

  async tap(): Promise<void> {
    if (!this.settings.settings().vibrate) return;
    try {
      await Haptics.vibrate({ duration: 20 });
    } catch {
      navigator.vibrate?.(20);
    }
  }

  speak(text: string): void {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    speechSynthesis.speak(u);
  }
}
