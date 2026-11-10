import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { ResponsiveService } from '../../services/responsive.service';
import { UserAvatar } from '../../shared/user-avatar/user-avatar';
import { UserService } from '../../services/user.service';

/**
 * Global application header containing title, responsive logo, help link, and user profile menu.
 */
@Component({
  imports: [RouterLink, UserAvatar],
  selector: 'header[app-header]',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  /** User service providing session state and current contact details. */
  protected readonly userService = inject(UserService);

  /** Navigation service providing current URL for conditional help icon rendering. */
  protected readonly navService = inject(NavigationService);

  /** Responsive service for mobile/desktop layout switches. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** State flag controlling dropdown menu visibility. */
  protected readonly menuOpen = signal<boolean>(false);

  /** Reference to the dropdown menu element for outside click detection. */
  private readonly menuRef = viewChild<ElementRef<HTMLElement>>('menuRef');

  /** Toggles user profile menu visibility. */
  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  /** Closes user profile menu. */
  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  /**
   * Closes user profile menu when clicking outside of it.
   *
   * @param event - The mouse click event.
   */
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;

    const menuElement = this.menuRef()?.nativeElement;
    if (menuElement && !menuElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  logout(): void {
    this.closeMenu();
    this.userService.logOut();
  }
}
