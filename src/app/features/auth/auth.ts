import { Component, signal } from '@angular/core';
import { Login } from './login/login';
import { Register } from './register/register';

@Component({
  imports: [Login, Register],
  selector: 'app-auth',
  styleUrl: './auth.scss',
  templateUrl: './auth.html',
})
export class Auth {
  showRegister = signal(false);
}
