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

export interface CategoryOption {
  value: string;
  label: string;
}

@Component({
  imports: [CheckboxComponent, UserAvatar],
  selector: 'app-dropdown',
  styleUrl: './dropdown.scss',
  templateUrl: './dropdown.html',
})
export class Dropdown {
  mode = input<'category' | 'assigned'>('category');
  categorySelected = output<string>();
  closeDropdown = output<void>();
  contactService = inject(ContactService);

  private elementRef = inject(ElementRef);

  categories: CategoryOption[] = [
    { value: 'Technical Task', label: 'Technical Task' },
    { value: 'User Story', label: 'User Story' },
  ];

  selectedContacts = input<ContactInterface[]>([]);
  contactsSelected = output<ContactInterface[]>();

  selectCategory(cat: CategoryOption) {
    this.categorySelected.emit(cat.value);
  }

  toggleContact(contact: ContactInterface) {
    const current = this.selectedContacts();
    const isSelected = current.some((c) => c.id === contact.id);

    let updated: ContactInterface[];
    if (isSelected) {
      updated = current.filter((c) => c.id !== contact.id);
    } else {
      updated = [...current, contact];
    }
    this.contactsSelected.emit(updated); // ← kein .set() mehr, nur emiten
  }

  isContactSelected = computed(() => (contact: ContactInterface) => {
    return this.selectedContacts().some((c) => c.id === contact.id);
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown.emit();
    }
  }
}
