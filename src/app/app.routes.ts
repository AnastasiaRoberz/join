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

export const routes: Routes = [
  // Authentification: main-screen with login-page as standard and navigation to sign-up
  {
    path: '',
    component: Auth,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  //canActivate: [Methodenname] -> property ruft Methode auf, die Pfad erst aktiviert, wenn eingeloggt -> für alle außer privacy und legal ergänzen (unten einfügen)
  //Main
  {
    path: 'app',
    component: Main,
    children: [
      //immer erreichbar
      { path: 'privacy-policy', component: PrivacyPolicy },
      { path: 'legal-notice', component: LegalNotice },

      //nur eingeloggt, canActivate kommt später
      { path: 'summary', component: Dashboard },
      { path: 'contacts', component: Contacts },
      { path: 'add-task', component: AddTask },
      { path: 'board', component: Board },
      { path: 'help', component: Help },

      //Weiterleitung, wenn URL leer
      // { path: '', redirectTo: 'summary', pathMatch: 'full' },
    ],
  },

  // { path: '**', redirectTo: 'login' }, //-> für später: wenn falsche URL, dann zu login (statt 404) -> bricht sofort ab, daher letzte stelle!
];
