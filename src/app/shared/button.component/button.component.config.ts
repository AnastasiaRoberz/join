import { ButtonInterface } from '../../interfaces/button.interface';

export type BtnPreset =
  | 'primary'
  | 'secondary'
  | 'x'
  | 'check'
  | 'addContact'
  | 'addTask'
  | 'editIcon'
  | 'deleteIcon'
  | 'close';

export const BUTTON_STYLES = {
  // * --- DEFAULTS --- *
  primary: {
    label: '',
    variant: 'primary',
    size: 'large',
    icon: null,
    type: 'button',
  },
  secondary: {
    label: '',
    variant: 'secondary',
    size: 'large',
    icon: null,
    type: 'button',
  },

  // * --- GLOBALS ---*
  x: {
    label: '',
    variant: 'secondary',
    size: 'large',
    icon: 'cancel',
    type: 'button',
  },
  check: {
    label: '',
    variant: 'primary',
    size: 'large',
    icon: 'check',
    type: 'button',
  },

  // * --- SPECIFIC BUTTONS --- *
  addContact: {
    label: 'Add new Contact',
    variant: 'add',
    size: 'large',
    icon: 'add-contact',
    type: 'button',
  },
  addTask: {
    label: 'Add Task',
    variant: 'add',
    size: 'large',
    icon: 'plus',
    type: 'button',
  },

  // * --- TEXT WITH ICON --- *
  editIcon: {
    label: 'Edit',
    variant: 'txtIcon',
    size: null,
    icon: 'edit',
    type: 'button',
  },
  deleteIcon: {
    label: 'Delete',
    variant: 'txtIcon',
    size: null,
    icon: 'delete',
    type: 'button',
  },

  // * --- ICON --- *
  close: {
    label: null,
    variant: 'icon',
    size: null,
    icon: 'cancel',
    type: 'button',
  },
  search: {
    label: null,
    variant: 'icon',
    size: null,
    icon: 'search',
    type: 'button',
  },
  addTaskIcon: {
    label: null,
    variant: 'add',
    size: 'small',
    icon: 'plus',
    type: 'button',
  },

  // * --- ICONS --- *
} as const satisfies Record<string, ButtonInterface>;
