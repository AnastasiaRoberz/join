import { computed, Service, signal } from '@angular/core';

// Manages the intro animation state and handles session-based visibility logic.
@Service()
export class IntroService {
  // Key used to store the intro status in sessionStorage.
  // constant that never changes
  private readonly STORAGE_KEY = 'intro-shown';

  // Private signals — only this service can write to them - can't be touched from outside.
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

  // Separate from _active: the logo intro is "first visit per session",
  // the greeting is "after every login". Sharing one flag would mean the
  // greeting never plays, because 'intro-shown' is already set by then.
  private _greeting = signal(false);
  readonly isGreeting = computed(() => this._greeting());

  // Set by the login, read by the dashboard. A plain field is enough:
  // routing to /summary doesn't reload the page, so the service keeps it.
  private greetingPending = false;

  // Call this in the login component right after a successful login (also guest login).
  requestGreeting(): void {
    this.greetingPending = true;
  }

  // Called by the dashboard before its first render.
  startGreeting(): void {
    // ?greeting in the URL forces the animation (development only, like ?intro)
    const forceGreeting = new URLSearchParams(window.location.search).has('greeting'); //remove after development

    if (this.greetingPending || forceGreeting) {
      this._greeting.set(true);
      this.greetingPending = false; // only once per login
    }
  }

  // Called when the overlay animation has finished.
  finishGreeting(): void {
    this._greeting.set(false);
  }
}
