import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonList,
  IonPopover,
  IonToggle,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { Settings, SettingsService } from '../../core/services/settings.service';

let nextId = 0;

/** Toolbar button with the courtside cue settings. */
@Component({
  selector: 'app-settings',
  imports: [IonButton, IonIcon, IonPopover, IonContent, IonList, IonItem, IonToggle],
  template: `
    <ion-button [id]="triggerId" aria-label="Settings">
      <ion-icon slot="icon-only" name="settings-outline" />
    </ion-button>
    <ion-popover [trigger]="triggerId" triggerAction="click">
      <ng-template>
        <ion-content>
          <ion-list lines="none">
            <ion-item>
              <ion-toggle
                [checked]="s().vibrate"
                (ionChange)="set('vibrate', $event.detail.checked)"
              >
                Vibrate on cues
              </ion-toggle>
            </ion-item>
            <ion-item>
              <ion-toggle [checked]="s().speak" (ionChange)="set('speak', $event.detail.checked)">
                Speak cues out loud
              </ion-toggle>
            </ion-item>
            <ion-item>
              <ion-toggle
                [checked]="s().keepAwake"
                (ionChange)="set('keepAwake', $event.detail.checked)"
              >
                Keep screen on
              </ion-toggle>
            </ion-item>
          </ion-list>
        </ion-content>
      </ng-template>
    </ion-popover>
  `,
})
export class SettingsComponent {
  private readonly settings = inject(SettingsService);
  protected readonly s = this.settings.settings;
  protected readonly triggerId = `settings-trigger-${nextId++}`;

  constructor() {
    addIcons({ settingsOutline });
  }

  protected set(key: keyof Settings, value: boolean): void {
    void this.settings.update({ [key]: value });
  }
}
