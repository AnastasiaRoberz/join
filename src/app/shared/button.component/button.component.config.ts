import { BtnInterface } from './button.component';

/**
 * Predefined button style configurations mapped by preset name.
 * Provides default variant, size, icon, icon position, and label settings.
 */
export const BUTTON_STYLES = {
  // * --- PRIMARY --- *
  primary: {
    variant: 'primary',
    size: 'large',
  },
  check: {
    variant: 'primary',
    size: 'large',
    icon: 'check',
    iconPos: 'right',
  },

  // * --- SECONDARY --- *
  secondary: {
    variant: 'secondary',
    size: 'large',
  },
  cancel: {
    variant: 'secondary',
    size: 'large',
    icon: 'x',
    iconPos: 'right',
  },

  // * --- ADD --- *
  addContact: {
    label: 'Add new Contact',
    variant: 'add',
    size: 'large',
    icon: 'add-contact',
    iconPos: 'right',
  },
  addTask: {
    label: 'Add Task',
    variant: 'add',
    size: 'large',
    icon: 'plus',
    iconPos: 'right',
  },

  // * --- TEXT WITH ICON --- *
  edit: {
    label: 'Edit',
    variant: 'text',
    icon: 'edit',
    iconPos: 'left',
  },
  delete: {
    label: 'Delete',
    variant: 'text',
    icon: 'delete',
    iconPos: 'left',
  },
  text: {
    variant: 'text',
    iconPos: 'left',
  },

  // * --- ICON --- *
  iconSmall: {
    variant: 'icon',
    size: 'small',
  },

  iconMedium: {
    variant: 'icon',
    size: 'medium',
  },
} as const satisfies Record<string, BtnInterface>;

/** Preset keys defined in `BUTTON_STYLES`. */
export type BtnPreset = keyof typeof BUTTON_STYLES;
