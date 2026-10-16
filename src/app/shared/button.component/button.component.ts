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
    '[attr.type]': 'type()',
  },
})
export class Buttons {
  preset = input<BtnPreset | null>(null);

  inputLabel = input<string | null>(null);
  inputVariant = input<BtnVariant | null>(null);
  inputSize = input<BtnSize | null>(null);
  inputIcon = input<string | null>(null);
  inputType = input<'button' | 'submit' | 'reset' | null>(null);

  btnConfig = computed(() => {
    const btnPreset = this.preset();
    return btnPreset ? BUTTON_STYLES[btnPreset] : null;
  });

  label = computed(() => this.inputLabel() ?? this.btnConfig()?.label ?? null);
  variant = computed(() => this.inputVariant() ?? this.btnConfig()?.variant ?? 'primary');
  size = computed(() => this.inputSize() ?? this.btnConfig()?.size ?? null);
  icon = computed(() => this.inputIcon() ?? this.btnConfig()?.icon ?? null);
  type = computed(() => this.inputType() ?? this.btnConfig()?.type ?? 'button');

  hostClasses = computed(() => {
    console.log(this.variant(), this.size());
    return `btn btn-${this.variant()}${this.size() ? ` btn-${this.size()}` : ''}`;
  });
}
