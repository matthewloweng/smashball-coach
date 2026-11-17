import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage) },
  {
    path: 'session',
    loadComponent: () => import('./features/session/session.page').then((m) => m.SessionPage),
  },
  {
    path: 'history',
    loadComponent: () => import('./features/history/history.page').then((m) => m.HistoryPage),
  },
  {
    path: 'history/:id',
    loadComponent: () =>
      import('./features/history/session-detail.page').then((m) => m.SessionDetailPage),
  },
  {
    path: 'games/:id',
    loadComponent: () => import('./features/game/game.page').then((m) => m.GamePage),
  },
  { path: '**', redirectTo: '' },
];
