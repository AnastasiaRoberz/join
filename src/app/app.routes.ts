import { Routes } from '@angular/router';
import { Main } from './features/main/main';
import { PrivacyPolicy } from './features/main/info/privacy-policy/privacy-policy';
import { LegalNotice } from './features/main/info/legal-notice/legal-notice';
import { Dashboard } from './features/main/dashboard/dashboard';
import { Contacts } from './features/main/contacts/contacts';
import { AddTask } from './features/main/add-task/add-task';
import { Board } from './features/main/board/board';
import { Help } from './features/main/info/help/help';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Auth } from './features/auth/auth';
import { authGuard } from './auth.guard';

/**
 * Application routes.
 * - `''`: authentication shell with `login` (default) and `register`.
 * - `'app'`: main shell.
 *   - `''` redirects to `summary`.
 *   - `privacy-policy` and `legal-notice` are always reachable (no guard).
 *   - All other pages are protected by `authGuard` (logged-in users only).
 * - `'**'`: catch-all, redirects to `/login` for unknown URLs.
 */
export const routes: Routes = [
  {
    path: '',
    component: Auth,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'app',
    component: Main,
    children: [
      { path: '', redirectTo: 'summary', pathMatch: 'full' },
      { path: 'privacy-policy', component: PrivacyPolicy },
      { path: 'legal-notice', component: LegalNotice },
      { path: 'summary', component: Dashboard, canActivate: [authGuard] },
      { path: 'contacts', component: Contacts, canActivate: [authGuard] },
      { path: 'add-task', component: AddTask, canActivate: [authGuard] },
      { path: 'board', component: Board, canActivate: [authGuard] },
      { path: 'help', component: Help, canActivate: [authGuard] },
    ],
  },

  { path: '**', redirectTo: '/login' },
];
