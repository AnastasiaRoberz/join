export interface Button {
  label: string | null;
  variant: 'primary' | 'secondary' | 'add' | 'icon' | 'txtIcon';
  size: 'medium' | 'large' | null;
  icon: string | null;
  type: 'button' | 'submit';
}
