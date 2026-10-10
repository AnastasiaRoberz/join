import { Component, computed, input } from '@angular/core';
import { BtnPreset, BUTTON_STYLES } from './buttons.config';

export type BtnVariant = 'primary' | 'secondary' | 'add' | 'icon';
export type BtnSize = 'small' | 'medium' | 'large';

@Component({
  imports: [],
  selector: 'button[appBtn], a[appBtn]',
  standalone: true,
  styleUrl: './buttons.scss',
  templateUrl: './buttons.html',
  host: {
    '[class]': 'hostClasses()',
    '[attr.type]': 'type()',
  },
})
export class Buttons {
  preset = input<BtnPreset | null>(null);

  inputVariant = input<BtnVariant | null>(null);
  inputSize = input<BtnSize | null>(null);
  inputIcon = input<string | null>(null);
  inputType = input<'button' | 'submit' | 'reset' | null>(null);

  btnConfig = computed(() => {
    const btnPreset = this.preset();
    return btnPreset ? BUTTON_STYLES[btnPreset] : null;
  });

  variant = computed(() => this.inputVariant() ?? this.btnConfig()?.variant ?? 'primary');
  size = computed(() => this.inputSize() ?? this.btnConfig()?.size ?? 'medium');
  icon = computed(() => this.inputIcon() ?? this.btnConfig()?.icon ?? null);
  type = computed(() => this.inputType() ?? this.btnConfig()?.type ?? 'button');

  hostClasses = computed(() => {
    return `btn 'btn-${this.variant()} btn-${this.size()}`;
  });
}
