import { Service, signal } from '@angular/core';

/**
 * Keeps the entered form values of the login and register page (never the password),
 * so they are not lost when the user switches between both pages.
 */
@Service()
export class AuthDraftService {
  /** Draft of the login form. */
  public readonly loginDraft = signal<{ mail?: string }>({});

  /** Draft of the register form. */
  public readonly registerDraft = signal<{
    name?: string;
    mail?: string;
  }>({});

  /** Discards both drafts, e.g. after a successful login or sign up. */
  public clearDrafts(): void {
    this.loginDraft.set({});
    this.registerDraft.set({});
  }
}
