import { computed, Service, signal } from '@angular/core';

// Manages the intro animation state and handles session-based visibility logic.
@Service()
export class IntroService {
  // Key used to store the intro status in sessionStorage.
  // constant that never changes
  private readonly STORAGE_KEY = 'intro-shown';

  // Private signals — only this service can write to them.
  // can't be touched from outside.
  private _active = signal(false);
  private _isMobile = signal(false);

  // Public read-only access — components can read but never write directly.
  readonly isActive = computed(() => this._active());
  readonly isMobile = computed(() => this._isMobile());

  // Starts the intro only if the user hasn't seen it yet this session.
  // Pass isMobile so the service knows which animation variant to trigger.
  startIntro(isMobile: boolean): void {
    // ?intro in the URL forces the animation to play — useful during development. --> e.g. write in url: /login?intro=
    // Remove forceIntro (and its usages below) before going to production.
    const forceIntro = new URLSearchParams(window.location.search).has('intro'); //remove after development
    const hasVisited = sessionStorage.getItem(this.STORAGE_KEY);

    this._isMobile.set(isMobile);

    if (!hasVisited || forceIntro) {
      this._active.set(true);

      // Only mark as visited in sessionStorage when not forcing via URL param.
      if (!forceIntro) {
        sessionStorage.setItem(this.STORAGE_KEY, 'true'); //nach test wieder aus if rausnehmen
      }
    }
  }

  // Called after the animation completes — hides the overlay and resets logo state.
  finish(): void {
    this._active.set(false);
  }
}
