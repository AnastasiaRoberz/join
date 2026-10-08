import { Routes } from '@angular/router';
import { ContactList } from './features/main/contacts/components/contact-list/contact-list';

export const routes: Routes = [
  {
    path: '',
    component: ContactList,
  },
];
