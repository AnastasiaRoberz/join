import { Button } from '../../interfaces/button';

export type BtnPreset = 'cancel';

export const BUTTON_STYLES = {
  cancel: {
    label: 'Cancel',
    variant: 'secondary',
    size: 'large',
    icon: 'cancel',
    type: 'button',
  },
  delete: {
    label: 'Delete',
    variant: 'secondary',
    size: 'large',
    icon: 'edit',
    type: 'button',
  },
  editIcon: {
    label: 'Edit',
    variant: 'txtIcon',
    size: 'small',
    icon: 'edit',
    type: 'button',
  },
  deleteIcon: {
    label: 'Delete',
    variant: 'txtIcon',
    size: 'small',
    icon: 'delete',
    type: 'button',
  },
  clear: {
    label: 'Clear',
    variant: 'secondary',
    size: 'medium',
    icon: 'cancel',
    type: 'button',
  },

  addContact: {
    label: 'Add new Contact',
    variant: 'primary',
    size: 'large',
    icon: 'add-contact',
    type: 'button',
  },
} as const satisfies Record<string, Button>;
