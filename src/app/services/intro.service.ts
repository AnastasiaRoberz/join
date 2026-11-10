import { computed, Service, signal } from '@angular/core';

/**
 * Manages the state of the intro animation (login page, once per browser session)
 * and of the greeting animation (dashboard, once after each login).
 */
@Service()
export class IntroService {
  /** Key used to store the intro status in sessionStorage. */
  private readonly STORAGE_KEY: string = 'intro-shown';

  /** Writable state, only this service can change it. */
  private readonly _active = signal<boolean>(false);
  private readonly _isMobile = signal<boolean>(false);

  /** Whether the greeting animation is running. */
  private readonly greeting = signal<boolean>(false);

  /** Whether a greeting is waiting to be shown (set after a successful login). */
  private greetingPending: boolean = false;

  /** Whether the intro animation is running (read-only). */
  public readonly isActive = computed<boolean>(() => this._active());

  /** Whether the intro runs in its mobile variant (read-only). */
  public readonly isMobile = computed<boolean>(() => this._isMobile());

  /** Whether the greeting animation is running (read-only). */
  public readonly isGreeting = computed<boolean>(() => this.greeting());

  /**
   * Starts the intro only if the user has not seen it yet in this session.
   * `?intro` in the URL (e.g. `/login?intro=`) forces the animation and does not mark it as seen.
   *
   * @param isMobile - Tells which animation variant to trigger.
   */
  public startIntro(isMobile: boolean): void {
    const forceIntro = new URLSearchParams(window.location.search).has('intro');
    const hasVisited = sessionStorage.getItem(this.STORAGE_KEY);

    this._isMobile.set(isMobile);
    if (hasVisited && !forceIntro) return;

    this._active.set(true);
    if (!forceIntro) sessionStorage.setItem(this.STORAGE_KEY, 'true');
  }

  /** Called after the intro animation completes, hides the overlay. */
  public finish(): void {
    this._active.set(false);
  }

  /** Called right after a successful login: the greeting is then pending. */
  public requestGreeting(): void {
    this.greetingPending = true;
  }

  /** Called by the dashboard, starts the greeting if one is pending (only once per login). */
  public startGreeting(): void {
    if (this.greetingPending) {
      this.greeting.set(true);
      this.greetingPending = false;
    }
  }

  /** Called when the overlay animation has finished: removes the overlay, the greeting goes back to normal. */
  public finishGreeting(): void {
    this.greeting.set(false);
  }
}
