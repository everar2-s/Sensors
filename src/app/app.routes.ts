import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password').then((m) => m.ResetPasswordPage) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'history', loadComponent: () => import('./pages/history/history').then((m) => m.HistoryPage) },
      { path: 'charts', loadComponent: () => import('./pages/charts/charts').then((m) => m.ChartsPage) },
      { path: 'devices', loadComponent: () => import('./pages/devices/devices').then((m) => m.DevicesPage) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
