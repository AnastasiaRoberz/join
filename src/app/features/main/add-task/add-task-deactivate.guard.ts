import { CanDeactivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AddTask } from './add-task';
import { ConfirmService } from '../../../services/confirm.service';
import { DraftService } from '../../../services/draft.service';

/** Info page URL prefixes where the task draft is preserved without user confirmation. */
const INFO_PAGE_PREFIXES: readonly string[] = [
  '/app/privacy-policy',
  '/app/legal-notice',
  '/app/help',
];

/** Main page URL prefixes where navigating away requires confirmation if entries exist. */
const MAIN_PAGE_PREFIXES: readonly string[] = ['/app/summary', '/app/board', '/app/contacts'];

/**
 * Route deactivate guard for the Add Task page.
 *
 * - When transitioning to an Info page (`help`, `legal-notice`, `privacy-policy`), the current form
 *   values are saved to `AuthDraftService` so they remain intact upon returning.
 * - When transitioning to one of the 3 other main pages (`summary`, `board`, `contacts`), the user
 *   is asked via `ConfirmService` whether to discard changes or continue editing.
 * - When navigating to `/login` (e.g. during logout), confirmation is requested if not already handled.
 *
 * @param component - The AddTask component instance being deactivated.
 * @param _currentRoute - Current route snapshot.
 * @param _currentState - Current router state snapshot.
 * @param nextState - Next router state snapshot.
 * @returns `true` to allow deactivation/navigation, or `false` to cancel.
 */
export const addTaskDeactivateGuard: CanDeactivateFn<AddTask> = async (
  component: AddTask,
  _currentRoute: ActivatedRouteSnapshot,
  _currentState: RouterStateSnapshot,
  nextState?: RouterStateSnapshot,
): Promise<boolean> => {
  const targetUrl = nextState?.url ?? '';

  // Navigating to an info page: silently preserve the draft and allow navigation
  const isInfoPage = INFO_PAGE_PREFIXES.some((prefix) => targetUrl.startsWith(prefix));
  if (isInfoPage) {
    component.saveDraft();
    return true;
  }

  // If there are no entries in the form, clear any residual draft and allow navigation
  if (!component.hasContent()) {
    component.clearDraft();
    return true;
  }

  // If staying on the Add Task page, allow
  if (targetUrl.startsWith('/app/add-task')) {
    return true;
  }

  const confirmService = inject(ConfirmService);
  const draftService = inject(DraftService);

  // If navigating to login (logout flow)
  if (targetUrl.startsWith('/login')) {
    // If draft was already cleared (e.g. confirmed via UserService.logOut), allow navigation
    if (!draftService.hasAddTaskDraft()) {
      component.skipDraftSave = true;
      component.onClear();
      return true;
    }

    const confirmed = await confirmService.askLogoutWithUnsavedTask();
    if (confirmed) {
      component.skipDraftSave = true;
      component.clearDraft();
      component.onClear();
      return true;
    }
    return false;
  }

  // Navigating to one of the other main pages (or any other route leaving add-task)
  const isMainPage = MAIN_PAGE_PREFIXES.some((prefix) => targetUrl.startsWith(prefix));
  if (isMainPage || !isInfoPage) {
    const confirmed = await confirmService.askDiscardTask();
    if (confirmed) {
      component.skipDraftSave = true;
      component.clearDraft();
      component.onClear();
      return true;
    }
    return false;
  }

  return true;
};
