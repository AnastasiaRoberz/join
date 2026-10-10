export interface Button {
  label: string;
  variant: 'primary' | 'secondary' | 'icon' | 'txtIcon';
  size: 'small' | 'medium' | 'large';
  icon?: string;
  type: 'button' | 'submit';
}
