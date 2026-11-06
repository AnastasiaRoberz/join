import { Service, signal } from '@angular/core';

@Service()
export class AuthDraftService {
  loginDraft = signal<{ mail?: string }>({});
  registerDraft = signal<{
    name?: string;
    mail?: string;
  }>({});

  clearLogin(): void {
    this.loginDraft.set({});
  }

  clearRegister(): void {
    this.registerDraft.set({});
  }
}
