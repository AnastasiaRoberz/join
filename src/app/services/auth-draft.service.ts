import { Service, signal } from '@angular/core';

@Service()
export class AuthDraftService {
  loginDraft = signal<{ mail?: string; password?: string }>({});
  registerDraft = signal<{
    name?: string;
    mail?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  clearLogin(): void {
    this.loginDraft.set({});
  }

  clearRegister(): void {
    this.registerDraft.set({});
  }
}
