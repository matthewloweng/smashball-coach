import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ViewDidEnter,
  ViewWillLeave,
} from '@ionic/angular';
import { SessionStore } from '../../core/services/session.store';
import { SettingsService } from '../../core/services/settings.service';
import { WakeLockService } from '../../core/services/wake-lock.service';
import { SettingsComponent } from '../../shared/components/settings.component';
import { BlockBarComponent } from './block-bar.component';
import { CourtCardComponent } from './court-card.component';
import { LevelsTabComponent } from './levels-tab.component';
import { PlanTabComponent } from './plan-tab.component';
import { TallyTabComponent } from './tally-tab.component';

type Tab = 'plan' | 'courts' | 'count' | 'levels';

@Component({
  selector: 'app-session',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonTextarea,
    SettingsComponent,
    BlockBarComponent,
    PlanTabComponent,
    CourtCardComponent,
    TallyTabComponent,
    LevelsTabComponent,
  ],
  templateUrl: './session.page.html',
  styles: `
    ion-segment-button {
      min-height: 44px;
      font-weight: 700;
    }
    .add-court {
      display: flex;
      justify-content: center;
      padding-bottom: 24px;
    }
    .notes {
      padding: 0 4px 24px;
    }
  `,
})
export class SessionPage implements ViewDidEnter, ViewWillLeave {
  protected readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertController);
  private readonly wakeLock = inject(WakeLockService);
  private readonly settings = inject(SettingsService);

  protected readonly tab = signal<Tab>('plan');

  ionViewDidEnter(): void {
    if (!this.store.session()) {
      void this.router.navigateByUrl('/', { replaceUrl: true });
      return;
    }
    if (this.settings.settings().keepAwake) void this.wakeLock.acquire();
  }

  ionViewWillLeave(): void {
    void this.wakeLock.release();
  }

  protected setTab(value: unknown): void {
    if (value === 'plan' || value === 'courts' || value === 'count' || value === 'levels')
      this.tab.set(value);
  }

  protected notes(value: string | null | undefined): void {
    void this.store.setNotes(value ?? '');
  }

  protected async finish(): Promise<void> {
    const confirm = await this.alerts.create({
      header: 'Finish practice?',
      message: 'Scores, counts and notes are saved to History.',
      buttons: [
        { text: 'Keep going', role: 'cancel' },
        { text: 'Finish', role: 'confirm' },
      ],
    });
    await confirm.present();
    const { role } = await confirm.onDidDismiss();
    if (role !== 'confirm') return;
    const id = await this.store.finish();
    await this.router.navigateByUrl(id ? `/history/${id}` : '/', { replaceUrl: true });
  }
}
