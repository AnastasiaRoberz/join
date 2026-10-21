import { Component, computed, input } from '@angular/core';
import { BtnPreset, BUTTON_STYLES } from './button.component.config';

export type BtnVariant = 'primary' | 'secondary' | 'add' | 'txtIcon' | 'icon';
export type BtnSize = 'small' | 'medium' | 'large' | null;

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

  label = input<string | null>(null);
  variant = input<BtnVariant | null>(null);
  size = input<BtnSize | null>(null);
  icon = input<string | null>(null);
  type = input<'button' | 'submit' | 'reset' | null>(null);

  btnConfig = computed(() => {
    const btnPreset = this.preset();
    return btnPreset ? BUTTON_STYLES[btnPreset] : null;
  });

  btnLabel = computed(() => this.label() ?? this.btnConfig()?.label ?? null);
  btnVariant = computed(() => this.variant() ?? this.btnConfig()?.variant ?? 'primary');
  btnSize = computed(() => this.size() ?? this.btnConfig()?.size ?? null);
  btnIcon = computed(() => this.icon() ?? this.btnConfig()?.icon ?? null);
  btnType = computed(() => this.type() ?? 'button');

  hostClasses = computed(() => {
    return `btn btn-${this.btnVariant()}${this.btnSize() ? ` btn-${this.btnSize()}` : ''}`;
  });
}
