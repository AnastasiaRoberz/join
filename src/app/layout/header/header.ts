import { Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';
import { ResponsiveService } from '../../services/responsive.service';
import { UserAvatar } from '../../shared/user-avatar/user-avatar';

@Component({
  imports: [RouterLink, UserAvatar],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
  },
})
export class Header {
  menuOpen = signal(false);
  private elementRef = inject(ElementRef);
  navService = inject(NavigationService);
  responsiveService = inject(ResponsiveService);

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }
}
