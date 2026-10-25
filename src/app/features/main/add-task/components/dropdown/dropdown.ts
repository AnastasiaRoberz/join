import { Component, ElementRef, HostListener, inject, input, output } from '@angular/core';
import { ContactService } from '../../../../../services/contact.service';

export interface CategoryOption {
  value: string;
  label: string;
}

@Component({
  imports: [],
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

  selectCategory(cat: CategoryOption) {
    this.categorySelected.emit(cat.value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown.emit();
    }
  }
}
