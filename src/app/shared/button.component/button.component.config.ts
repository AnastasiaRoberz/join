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
  },
  secondary: {
    label: '',
    variant: 'secondary',
    size: 'large',
    icon: null,
  },

  // * --- GLOBALS ---*
  x: {
    label: '',
    variant: 'secondary',
    size: 'large',
    icon: 'x',
  },
  check: {
    label: '',
    variant: 'primary',
    size: 'large',
    icon: 'check',
  },

  // * --- SPECIFIC BUTTONS --- *
  addContact: {
    label: 'Add new Contact',
    variant: 'add',
    size: 'large',
    icon: 'add-contact',
  },
  addTask: {
    label: 'Add Task',
    variant: 'add',
    size: 'large',
    icon: 'plus',
  },

  // * --- TEXT WITH ICON --- *
  editIcon: {
    label: 'Edit',
    variant: 'txtIcon',
    size: null,
    icon: 'edit',
  },
  deleteIcon: {
    label: 'Delete',
    variant: 'txtIcon',
    size: null,
    icon: 'delete',
  },

  // * --- ICON --- *
  close: {
    label: null,
    variant: 'icon',
    size: null,
    icon: 'x',
  },
  search: {
    label: null,
    variant: 'icon',
    size: null,
    icon: 'search',
  },
  addTaskIcon: {
    label: null,
    variant: 'add',
    size: 'small',
    icon: 'plus',
  },

  // * --- ICONS --- *
} as const satisfies Record<string, ButtonInterface>;
