import { Component, computed, input } from '@angular/core';
import { BtnPreset, BUTTON_STYLES } from './button.component.config';

export type BtnVariant = 'primary' | 'secondary' | 'add' | 'text' | 'icon';
export type BtnSize = 'small' | 'medium' | 'large';
export type BtnType = 'button' | 'submit' | 'reset';
export type IconPos = 'left' | 'right';

export interface BtnInterface {
  variant: BtnVariant;
  size?: BtnSize;
  icon?: string;
  iconPos?: IconPos;
  label?: string;
}

/*
  example: <button appBtn preset="close" (click)="closeDialog()"></button>
*/

@Component({
  imports: [],
  selector: 'button[appBtn], a[appBtn]',
  standalone: true,
  styleUrl: './button.component.scss',
  templateUrl: './button.component.html',
  host: {
    '[class]': 'hostClasses()',
    '[attr.type]': 'btnType()',
  },
})
export class Buttons {
  preset = input<BtnPreset | null>(null);
  variant = input<BtnVariant | null>(null);
  size = input<BtnSize | null>(null);
  icon = input<string | null>(null);
  iconPos = input<IconPos | null>(null);
  label = input<string | null>(null);
  type = input<BtnType | null>(null);

  isFab = input<boolean>(false);

  activePreset = computed<BtnInterface | null>(() => {
    const btnPreset = this.preset();
    return btnPreset ? BUTTON_STYLES[btnPreset] : null;
  });

  btnVariant = computed<BtnVariant>(
    () => this.variant() ?? this.activePreset()?.variant ?? 'primary',
  );
  btnSize = computed<BtnSize>(() => this.size() ?? this.activePreset()?.size ?? 'large');
  btnIcon = computed<string | null>(() => this.icon() ?? this.activePreset()?.icon ?? null);
  btnIconPos = computed<IconPos>(() => this.iconPos() ?? this.activePreset()?.iconPos ?? 'right');
  btnLabel = computed<string | null>(() => this.label() ?? this.activePreset()?.label ?? null);
  btnType = computed<BtnType>(() => this.type() ?? 'button');

  hostClasses = computed(() => {
    const classes = ['btn', `btn--${this.btnVariant()}`];

    if (this.btnSize()) {
      classes.push(`btn--${this.btnSize()}`);
    }
    if (this.preset()) {
      classes.push(`btn--${this.preset()}`);
    }
    if (this.isFab()) {
      classes.push('btn--fab');
    }
    return classes.join(' ');
  });
}
