import { Service, signal } from '@angular/core';
import { ContactInterface } from '../interfaces/contact.interface';
import { TaskInterface } from '../interfaces/task.interface';

export type DialogContentType = 'contact' | 'task' | null;

@Service()
export class DialogService {
  isOpen = signal<boolean>(false);
  dialogType = signal<DialogContentType>(null);
  selectedItem = signal<any | null>(null);

  openDialog<T>(type: DialogContentType, item: T | null = null): void {
    this.dialogType.set(type);
    this.selectedItem.set(item);
    this.isOpen.set(true);
  }

  closeDialog(): void {
    this.dialogType.set(null);
    this.selectedItem.set(null);
    this.isOpen.set(false);
  }
}
