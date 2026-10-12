export interface Button {
  label: string | null;
  variant: 'primary' | 'secondary' | 'add' | 'txtIcon' | 'icon';
  size: 'small' | 'medium' | 'large' | null;
  icon: string | null;
  type: 'button' | 'submit';
}
