import { computed, Service, signal } from '@angular/core';

@Service()
export class IntroService {
  private readonly STORAGE_KEY = 'intro-shown';

  private _active = signal(false);
  private _isMobile = signal(false);

  readonly isActive = computed(() => this._active());
  readonly isMobile = computed(() => this._isMobile());

  startIfNeeded(isMobile: boolean): void {
    const forceIntro = new URLSearchParams(window.location.search).has('intro'); //für Test, später entfernen
    const hasVisited = sessionStorage.getItem(this.STORAGE_KEY);

    this._isMobile.set(isMobile);

    if (!hasVisited || forceIntro) {
      this._active.set(true);

      if (!forceIntro) {
        sessionStorage.setItem(this.STORAGE_KEY, 'true'); //nach test wieder aus if rausnehmen
      }
    }
  }

  finish(): void {
    this._active.set(false);
  }
}
