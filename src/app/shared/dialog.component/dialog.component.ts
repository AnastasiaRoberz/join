import { Component, inject } from '@angular/core';
import { DialogService } from '../../services/dialog.service';
import { ContactDialog } from '../../features/main/contacts/components/contact-dialog/contact-dialog';
import { TaskDetails } from '../../features/main/board/components/task-details/task-details';
import { TaskEdit } from '../../features/main/board/components/task-edit/task-edit';

@Component({
  imports: [ContactDialog, TaskDetails, TaskEdit],
  selector: 'app-dialog',
  styleUrl: './dialog.component.scss',
  templateUrl: './dialog.component.html',
  host: {
    '(click)': 'dialogService.closeDialog()',
    '[class.is-open]': 'dialogService.isOpen()',
  },
})
export class DialogComponent {
  dialogService = inject(DialogService);
}
