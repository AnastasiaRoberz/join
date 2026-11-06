import { Service, signal } from '@angular/core';

@Service()
export class AuthDraftService {
  loginDraft = signal<{ mail?: string }>({});
  registerDraft = signal<{
    name?: string;
    mail?: string;
  }>({});

  clearDrafts(): void {
    this.loginDraft.set({});
    this.registerDraft.set({});
  }
}
