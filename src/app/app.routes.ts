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

export const routes: Routes = [
  //   { path: 'login', component: Login }, //für später: login-page

  //main-Pfad soll immer erreichbar sein mit Privacy & legal, auch ohne login (inkl. sidebar + header nach design)
  {
    path: '',
    component: Main,
    children: [
      { path: 'privacy-policy', component: PrivacyPolicy },
      { path: 'legal-notice', component: LegalNotice },
    ],
  },

  //main-Pfad nur im eingeloggten Zustand zusätzlich zu oberem main-Pfad -> durch Methode erst aktiviert (nach Login)
  {
    path: '',
    component: Main,
    // canActivate: [Methodenname], //property ruft Methode auf, die Pfad erst aktiviert, wenn eingeloggt
    children: [
      { path: 'summary', component: Dashboard },
      { path: 'contacts', component: Contacts },
      { path: 'add-task', component: AddTask },
      { path: 'board', component: Board },
      { path: 'help', component: Help },
      { path: '', redirectTo: 'summary', pathMatch: 'full' }, //wenn url leer: zu summary weiterleiten
    ],
  },
  //   {path: '**', redirectTo: 'login'} //-> für später: wenn falsche URL, dann zu login (statt 404) -> bricht sofort ab, daher letzte stelle!
];
