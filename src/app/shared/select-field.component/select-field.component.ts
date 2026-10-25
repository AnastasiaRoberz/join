import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ResponsiveService } from '../../services/responsive.service';
import { ContactInterface } from '../../interfaces/contact.interface';
import { UserAvatar } from '../user-avatar/user-avatar';
import { CheckboxComponent } from '../checkbox.component/checkbox.component';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { CdkOverlayOrigin, ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import { filterInput } from '../../utils/utils';

let nextId = 0;

@Component({
  imports: [
    UserAvatar,
    CheckboxComponent,
    Combobox,
    ComboboxPopup,
    Listbox,
    Option,
    OverlayModule,
    ComboboxWidget,
  ],
  selector: 'app-select-field',
  styleUrl: './select-field.component.scss',
  templateUrl: './select-field.component.html',
})
export class SelectFieldComponent {
  responsiveService = inject(ResponsiveService);
  private overlay = inject(Overlay);

  id = input<string>(`app-select-${nextId++}`);
  label = input<string>();
  options = input<ContactInterface[]>([]);
  searchTerm = signal<string>('');
  filteredOptions = computed(() => {
    return filterInput(this.options(), this.searchTerm(), (contact) => [
      contact.firstname,
      contact.surname,
    ]);
  });

  inputField = viewChild<ElementRef<HTMLInputElement>>('inputField');

  constructor() {
    effect(() => {
      if (!this.popupExpanded()) {
        this.searchTerm.set('');
        const element = this.inputField()?.nativeElement;
        if (element) element.value = '';
      }
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  selectedIds = model<number[]>([]);
  assignedContacts = computed(() => {
    const ids = new Set(this.selectedIds());
    return this.options().filter((contact) => ids.has(contact.id));
  });

  /** The combobox listbox popup. */
  readonly listbox = viewChild(Listbox);

  /** Whether the popup is expanded. */
  readonly popupExpanded = signal(false);
  readonly trigger = viewChild<CdkOverlayOrigin>('trigger');

  private readonly positionAbove: ConnectedPosition = {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
  };

  private readonly positionBelow: ConnectedPosition = {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
  };

  positions = signal<ConnectedPosition[]>([this.positionBelow, this.positionAbove]);

  togglePopup(): void {
    if (!this.popupExpanded()) {
      this.openPopup();
    } else {
      this.closePopup();
    }
  }

  openPopup(): void {
    this.updateOverlayDirection();
    this.popupExpanded.set(true);
    this.searchTerm.set('');
  }

  closePopup(): void {
    this.popupExpanded.set(false);
    this.searchTerm.set('');
  }

  isAssigned(contactId: number): boolean {
    return this.selectedIds().includes(contactId);
  }

  toggleAssignment(contactId: number, checked: boolean): void {
    this.selectedIds.update((currentIds) => {
      if (checked) {
        return currentIds.includes(contactId) ? currentIds : [...currentIds, contactId];
      } else {
        return currentIds.filter((id) => id !== contactId);
      }
    });
  }

  private updateOverlayDirection(): void {
    const el = this.trigger()?.elementRef.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      this.positions.set([this.positionAbove, this.positionBelow]);
    } else {
      this.positions.set([this.positionBelow, this.positionAbove]);
    }
  }

  readonly scrollStrategy = this.overlay.scrollStrategies.reposition({
    autoClose: false,
  });
}
