import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './services/supabase.service';
import { UserService } from './services/user.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const userService = inject(UserService);
  const router = inject(Router);
  const { data } = await supabaseService.supabase.auth.getSession();
  if (data.session) {
    if (!userService.currentUser()) {
      userService.currentUser.set(data.session.user);
      userService.currentSession.set(data.session);
    }
    return true;
  }
  return router.createUrlTree(['/login']);
};
