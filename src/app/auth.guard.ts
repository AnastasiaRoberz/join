import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SupabaseService } from './services/supabase.service';
import { UserService } from './services/user.service';
import { inject } from '@angular/core';

/**
 * Route guard that only lets logged-in users pass.
 * If a Supabase session exists, it restores `currentUser`/`currentSession` (e.g. after a page reload).
 *
 * @returns `true` if a session exists, otherwise a `UrlTree` redirecting to `/login`.
 */
export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const userService = inject(UserService);
  const router = inject(Router);
  const hasSession = await userService.restoreSession();
  if (hasSession) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
