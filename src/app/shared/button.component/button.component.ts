import { Component, computed, input } from '@angular/core';
import { BtnPreset, BUTTON_STYLES } from './button.component.config';

/**
 * Visual styling variants for buttons.
 * - `primary`: Main brand action button (dark navy, white text).
 * - `secondary`: Outline button with border and transparent background.
 * - `add`: Specialized action button with cyan hover effect and larger icon/gap.
 * - `text`: Subtle text-only button with icon (e.g., Edit, Delete) and bold hover state.
 * - `icon`: Circular or square button with icon only (no label).
 */
export type BtnVariant = 'primary' | 'secondary' | 'add' | 'text' | 'icon';

/**
 * Predefined size dimensions for buttons.
 * - `small`: Compact padding, ideal for mobile or small tables.
 * - `medium`: Standard compact size.
 * - `large`: Default primary button size.
 */
export type BtnSize = 'small' | 'medium' | 'large';

/**
 * Native HTML button element types.
 */
export type BtnType = 'button' | 'submit' | 'reset';

/**
 * Position of the icon relative to the button text.
 */
export type IconPos = 'left' | 'right';

/**
 * Configuration interface describing the visual and functional properties of a button.
 */
export interface BtnInterface {
  /** The visual color and style variant. */
  variant: BtnVariant;
  /** The size/padding dimension of the button. */
  size?: BtnSize;
  /** SVG icon identifier referencing the icon sprite (e.g. 'plus', 'check', 'x'). */
  icon?: string;
  /** Placement of the icon relative to the label ('left' or 'right'). */
  iconPos?: IconPos;
  /** Optional button label text. */
  label?: string;
}

/**
 * Reusable and highly customizable button component / attribute directive.
 *
 * Works as an attribute selector on native `<button>` and `<a>` elements:
 * `button[appBtn], a[appBtn]`.
 *
 * ### Architecture & Philosophy:
 * 1. **Presets:** You can use predefined presets (`preset="addTask"`, `preset="close"`, etc.)
 *    for common actions to avoid repeating icons, variants, and sizes across templates.
 * 2. **Override Mechanism:** Any explicit input (`variant`, `size`, `icon`, `label`)
 *    takes precedence over preset values.
 * 3. **Labels & Content:** The button label can either be provided via the `label` input,
 *    via preset configuration, or projected directly via `<ng-content>`.
 *
 * @example
 * ```html
 * <!-- 1. Using a predefined preset -->
 * <button appBtn preset="addContact" (click)="openDialog()"></button>
 *
 * <!-- 2. Using a preset with custom projected text -->
 * <button appBtn preset="check" type="submit">Create Task</button>
 *
 * <!-- 3. Standalone custom configuration without a preset -->
 * <button appBtn variant="primary" size="medium" icon="plus" iconPos="left">
 *   Add Item
 * </button>
 *
 * <!-- 4. Floating Action Button (FAB) on mobile -->
 * <button appBtn preset="addContact" [isFab]="true" (click)="create()"></button>
 *
 * <!-- 5. Anchor element navigation -->
 * <a appBtn variant="secondary" routerLink="/board">Go to Board</a>
 * ```
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
  /**
   * Predefined button configuration key matching `BUTTON_STYLES` in the config.
   * Defines default values for variant, size, icon, icon position, and label.
   */
  preset = input<BtnPreset | null>(null);

  /**
   * Overrides or defines the visual style variant.
   */
  variant = input<BtnVariant | null>(null);

  /**
   * Overrides or defines the button size.
   */
  size = input<BtnSize | null>(null);

  /**
   * Overrides or defines the SVG symbol ID in the icons sprite (e.g. 'check', 'x', 'plus').
   */
  icon = input<string | null>(null);

  /**
   * Overrides or defines the position of the icon ('left' or 'right').
   */
  iconPos = input<IconPos | null>(null);

  /**
   * Overrides or defines the text label. If omitted, projected `<ng-content>` is used.
   */
  label = input<string | null>(null);

  /**
   * Native HTML button `type` attribute ('button', 'submit', 'reset').
   * Defaults to 'button'.
   */
  type = input<BtnType | null>(null);

  /**
   * When `true`, applies the `.btn--fab` class for round floating action button positioning.
   */
  isFab = input<boolean>(false);

  /**
   * Evaluates the active preset configuration from `BUTTON_STYLES` if a preset is assigned.
   * Explicitly typed as `BtnInterface | null` to widen literal union types and allow safe optional access.
   */
  activePreset = computed<BtnInterface | null>(() => {
    const btnPreset = this.preset();
    return btnPreset ? BUTTON_STYLES[btnPreset] : null;
  });

  /**
   * Effective variant. Prioritizes explicit `variant` input over preset, falling back to 'primary'.
   */
  btnVariant = computed<BtnVariant>(
    () => this.variant() ?? this.activePreset()?.variant ?? 'primary',
  );

  /**
   * Effective size. Prioritizes explicit `size` input over preset, falling back to 'large'.
   */
  btnSize = computed<BtnSize>(() => this.size() ?? this.activePreset()?.size ?? 'large');

  /**
   * Effective icon ID. Prioritizes explicit `icon` input over preset.
   */
  btnIcon = computed<string | null>(() => this.icon() ?? this.activePreset()?.icon ?? null);

  /**
   * Effective icon position. Defaults to 'right' if not provided by input or preset.
   */
  btnIconPos = computed<IconPos>(() => this.iconPos() ?? this.activePreset()?.iconPos ?? 'right');

  /**
   * Effective text label provided via input or preset.
   */
  btnLabel = computed<string | null>(() => this.label() ?? this.activePreset()?.label ?? null);

  /**
   * Effective native button type. Defaults to 'button' to prevent accidental form submission.
   */
  btnType = computed<BtnType>(() => this.type() ?? 'button');

  /**
   * Generates the dynamic BEM CSS classes bound to the host element.
   * Pattern: `btn btn--{variant} btn--{size} [btn--{preset}] [btn--fab]`
   */
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
