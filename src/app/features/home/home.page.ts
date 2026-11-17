import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { playCircle, timeOutline, chevronForward, settingsOutline } from 'ionicons/icons';
import { SessionStore } from '../../core/services/session.store';
import { TemplateService } from '../../core/services/template.service';
import { SessionPlan } from '../../core/models/template.models';
import { SettingsComponent } from '../../shared/components/settings.component';

@Component({
  selector: 'app-home',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    RouterLink,
    SettingsComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly alerts = inject(AlertController);
  private readonly router = inject(Router);
  protected readonly templates = inject(TemplateService);
  protected readonly sessions = inject(SessionStore);
  protected readonly pack = this.templates.pack;

  constructor() {
    addIcons({ playCircle, timeOutline, chevronForward, settingsOutline });
  }

  protected gameCode(plan: SessionPlan): string {
    return this.templates.game(plan.gameId).code;
  }

  protected async start(plan: SessionPlan): Promise<void> {
    if (this.sessions.session()) {
      const confirm = await this.alerts.create({
        header: 'A practice is still running',
        message: 'Finish it and start this one? The running practice is saved to History.',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Finish and start', role: 'confirm' },
        ],
      });
      await confirm.present();
      const { role } = await confirm.onDidDismiss();
      if (role !== 'confirm') return;
      await this.sessions.finish();
    }
    const courts = await this.alerts.create({
      header: `Practice ${plan.number}`,
      subHeader: plan.title,
      message: 'How many courts or lanes are you scoring?',
      inputs: [1, 2, 3, 4].map((n) => ({
        type: 'radio' as const,
        label: `${n}`,
        value: n,
        checked: n === 2,
      })),
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Start', role: 'confirm' },
      ],
    });
    await courts.present();
    const { role, data } = await courts.onDidDismiss<{ values: number }>();
    if (role !== 'confirm') return;
    await this.sessions.start(plan.id, data?.values ?? 2);
    await this.router.navigateByUrl('/session');
  }
}
