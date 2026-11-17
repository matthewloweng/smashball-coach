import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { routes } from './app.routes';
import { SessionStore } from './core/services/session.store';
import { SettingsService } from './core/services/settings.service';
import { KEY_VALUE_STORE, PreferencesStore } from './core/storage/key-value-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(routes, withComponentInputBinding()),
    { provide: KEY_VALUE_STORE, useFactory: () => new PreferencesStore() },
    provideAppInitializer(async () => {
      const settings = inject(SettingsService);
      const sessions = inject(SessionStore);
      await Promise.all([settings.load(), sessions.restore()]);
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
