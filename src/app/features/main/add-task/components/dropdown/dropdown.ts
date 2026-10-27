import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ContactService } from '../../../../../services/contact.service';
import { CheckboxComponent } from '../../../../../shared/checkbox.component/checkbox.component';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { ContactInterface } from '../../../../../interfaces/contact.interface';

/**
 * A selectable option in the category dropdown.
 */
export interface CategoryOption {
  /** Value emitted when the option is selected. */
  value: string;
  /** Text displayed to the user. */
  label: string;
}

/**
 * Dropdown list that works in two modes:
 * - `'category'`: single selection of a task category
 * - `'assigned'`: multi-selection of contacts via checkboxes
 *
 * The component holds no selection state for contacts. The parent passes the current
 * selection in via `selectedContacts` and receives the updated list via `contactsSelected`.
 * Clicking outside of the component emits `closeDropdown`.
 *
 * @example
 * <app-dropdown mode="category" (categorySelected)="onCategorySelected($event)"></app-dropdown>
 */
@Component({
  imports: [CheckboxComponent, UserAvatar],
  selector: 'app-dropdown',
  styleUrl: './dropdown.scss',
  templateUrl: './dropdown.html',
})
export class Dropdown {
  /**
   * Display mode of the dropdown. Defaults to `'category'`.
   */
  mode = input<'category' | 'assigned'>('category');

  /**
   * Emits the value of the selected category (mode `'category'`).
   */
  categorySelected = output<string>();

  /**
   * Emits when the dropdown should be closed, e.g. after a click outside of it.
   */
  closeDropdown = output<void>();

  /**
   * Provides the list of all contacts shown in mode `'assigned'`.
   */
  contactService = inject(ContactService);

  /**
   * Reference to the host element, used to detect clicks outside of the dropdown.
   */
  private elementRef = inject(ElementRef);

  /**
   * Categories offered in mode `'category'`.
   */
  categories: CategoryOption[] = [
    { value: 'Technical Task', label: 'Technical Task' },
    { value: 'User Story', label: 'User Story' },
  ];

  /**
   * Contacts that are currently selected (mode `'assigned'`), provided by the parent.
   */
  selectedContacts = input<ContactInterface[]>([]);

  /**
   * Emits the updated list of selected contacts after a contact was toggled.
   */
  contactsSelected = output<ContactInterface[]>();

  /**
   * Emits the value of the chosen category via `categorySelected`.
   *
   * @param cat - The category option that was clicked
   */
  selectCategory(cat: CategoryOption) {
    this.categorySelected.emit(cat.value);
  }

  /**
   * Adds the contact to the selection if it is not selected yet, otherwise removes it,
   * and emits the new list via `contactsSelected`. The input `selectedContacts` itself
   * is not modified.
   *
   * @param contact - The contact to toggle
   */
  toggleContact(contact: ContactInterface) {
    const current = this.selectedContacts();
    const isSelected = current.some((c) => c.id === contact.id);

    let updated: ContactInterface[];
    if (isSelected) {
      updated = current.filter((c) => c.id !== contact.id);
    } else {
      updated = [...current, contact];
    }
    this.contactsSelected.emit(updated);
  }

  /**
   * Computed predicate that checks whether a contact is part of `selectedContacts`.
   * Used by the template to set the checkbox state.
   *
   * @returns A function that returns `true` if the given contact is selected
   */
  isContactSelected = computed(() => (contact: ContactInterface) => {
    return this.selectedContacts().some((c) => c.id === contact.id);
  });

  /**
   * Emits `closeDropdown` when a click happens outside of this component.
   *
   * @param event - The click event on the document
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown.emit();
    }
  }
}
