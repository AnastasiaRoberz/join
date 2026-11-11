import {
  booleanAttribute,
  ChangeDetectorRef,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { CdkOverlayOrigin, ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { ResponsiveService } from '../../services/responsive.service';
import { filterInput } from '../../utils/utils';
import { Buttons } from '../button.component/button.component';
import { ErrorService } from '../../services/error.service';
import { ControlValueAccessor, NgControl } from '@angular/forms';

/** Global counter used to generate unique DOM IDs for select field instances. */
let nextId = 0;

/**
 * Generic, accessible select and autocomplete combobox component built on top of
 * `@angular/aria/combobox`, `@angular/aria/listbox`, and `@angular/cdk/overlay`.
 * Supports multi-select, single-select, and searchbar modes.
 *
 * @typeParam T - Data type of the option items passed to `[options]`.
 */
@Component({
  imports: [
    Combobox,
    ComboboxPopup,
    ComboboxWidget,
    Listbox,
    Option,
    OverlayModule,
    NgTemplateOutlet,
    Buttons,
  ],
  selector: 'app-select-field',
  styleUrl: './select-field.component.scss',
  templateUrl: './select-field.component.html',
})
export class SelectFieldComponent<T = any> implements ControlValueAccessor {
  /** Service used to adapt label styling to mobile/desktop viewports. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Service used to generate human-readable validation error messages. */
  private readonly errorService = inject(ErrorService);

  /** Injected `NgControl` binding this component to the parent Angular form control. */
  private readonly ngControl = inject(NgControl, { optional: true });

  /** ChangeDetectorRef used to trigger view updates when the form control state changes. */
  private readonly cdr = inject(ChangeDetectorRef);

  // ---------------------------------------------------------------------------
  // Inputs & Two-Way Models
  // ---------------------------------------------------------------------------

  /** Unique HTML id attribute for the underlying input element. */
  public readonly fieldId = input<string>(`app-select-${nextId++}`);

  /** Optional label text displayed above the select input. */
  public readonly label = input<string>();

  /** Placeholder text shown inside the input when no value is displayed. */
  public readonly placeholder = input<string>('Select an option');

  /** Fallback message displayed inside the dropdown when filtering yields no matches. */
  public readonly emptyText = input<string>('No results found.');

  public readonly filterButton = input<boolean>(false);

  /** Full list of selectable items of type `T`. */
  public readonly options = input<T[]>([]);

  /**
   * Visual and behavioral variant of the component:
   * - `'select'` (default): Standard dropdown that opens on click.
   * - `'search'`: Searchbar that opens on typing and clears input after selection.
   */
  public readonly variant = input<'select' | 'search'>('select');

  /** Whether multiple options can be selected simultaneously. */
  public readonly multi = input<boolean>(false);

  /** Whether clicking the input field opens the dropdown popup. Ignored in search mode. */
  public readonly openOnClick = input<boolean>(true);

  /** Whether typing into the input field automatically opens the dropdown popup. */
  public readonly openOnTyping = input<boolean>(true);

  /** Two-way bound selection value (single key, array of keys, or transient key). */
  public readonly value = model<any>();

  /** Extracts unique primitive identifier from an option item. */
  public readonly valueKey = input<(item: T) => any>((item: any) =>
    item && typeof item === 'object' && 'id' in item ? item.id : item,
  );

  /** Formats an option item into display text. */
  public readonly labelFn = input<(item: T) => string>((item: any) =>
    typeof item === 'string' ? item : (item?.name ?? ''),
  );

  /** Extracts searchable strings matched via `includes()` against `searchTerm()`. */
  public readonly getSearchStrings = input<(item: T) => (string | undefined | null)[]>(
    (item: any) => [typeof item === 'string' ? item : (item?.name ?? '')],
  );

  /** Marks the field as required in template. */
  public readonly required = input<boolean>(false);

  /** Enables scrolling in the dropdown listbox. */
  public readonly scrollable = input<boolean>(true);

  /** Shows generic required message instead of field-specific. */
  public readonly requiredMsg = input(false, { transform: booleanAttribute });

  /** Emits search query string in real time on every input keystroke. */
  public readonly searchChange = output<string>();

  // ---------------------------------------------------------------------------
  // Content & View Queries
  // ---------------------------------------------------------------------------

  /** Optional custom projected row template `#optionTemplate`. */
  protected readonly optionTemplate =
    contentChild<TemplateRef<{ $implicit: T; selected: boolean }>>('optionTemplate');

  /** Reference to the native text input element. */
  protected readonly inputField = viewChild<ElementRef<HTMLInputElement>>('inputField');

  /** Reference to the CDK overlay origin container. */
  public readonly trigger = viewChild<CdkOverlayOrigin>('trigger');

  // ---------------------------------------------------------------------------
  // Internal State & Computed Signals
  // ---------------------------------------------------------------------------

  /** Current search query typed into the combobox input. */
  protected readonly searchTerm = signal<string>('');

  /** Whether the CDK overlay dropdown popup is currently open. */
  public readonly popupExpanded = signal<boolean>(false);

  /** Tracks previous open state for blur touch reporting. */
  private wasOpen = false;

  /** Overlay position above the input. */
  private readonly positionAbove: ConnectedPosition = {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
  };

  /** Overlay position below the input. */
  private readonly positionBelow: ConnectedPosition = {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
  };

  /** Ordered list of preferred CDK overlay positions. */
  protected readonly positions = signal<ConnectedPosition[]>([
    this.positionBelow,
    this.positionAbove,
  ]);

  /** Filtered options matching `searchTerm()`. */
  protected readonly filteredOptions = computed<T[]>(() =>
    filterInput(this.options(), this.searchTerm(), this.getSearchStrings()),
  );

  /** Normalized array of all currently selected keys from `value()`. */
  protected readonly selectedKeys = computed<any[]>(() => {
    const current = this.value();
    if (current == null || current === '') return [];
    return Array.isArray(current) ? current : [current];
  });

  /** Subset of selected keys visible in `filteredOptions()` for listbox synchronization. */
  protected readonly listboxValue = computed<any[]>(() => {
    if (this.variant() === 'search') return [];
    const visibleKeys = new Set(this.filteredOptions().map((opt) => this.valueKey()(opt)));
    return this.selectedKeys().filter((key) => visibleKeys.has(key));
  });

  /** Formatted text displayed inside the input element. */
  protected readonly displayValue = computed<string>(() => {
    if (
      this.multi() ||
      this.variant() === 'search' ||
      (this.popupExpanded() && this.searchTerm())
    ) {
      return this.searchTerm();
    }
    const currentVal = this.value();
    if (currentVal == null || currentVal === '') return '';
    const matchedOption = this.options().find((opt) => this.valueKey()(opt) === currentVal);
    return this.labelFn()(matchedOption ?? currentVal);
  });

  /** Form control change notification callback. */
  private onChange: (v: any) => void = () => {};
  /** Form control touch notification callback. */
  private onTouched: () => void = () => {};

  /** Registers ControlValueAccessor and initializes reactive popup and control event effects. */
  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.initPopupEffects();
    this.initControlEventsEffect();
  }

  // ---------------------------------------------------------------------------
  // ControlValueAccessor Implementation
  // ---------------------------------------------------------------------------

  /** Writes a new form control value into the component. */
  public writeValue(val: any): void {
    this.value.set(val);
    this.cdr.markForCheck();
  }

  /** Registers callback to notify form of value changes. */
  public registerOnChange(fn: (v: any) => void): void {
    this.onChange = fn;
  }

  /** Registers callback to notify form of touched state. */
  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ---------------------------------------------------------------------------
  // User Interaction & Popup Methods
  // ---------------------------------------------------------------------------

  /** Handles input typing and opens popup if non-empty and openOnTyping is true. */
  protected onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    this.searchChange.emit(val);
    if (this.openOnTyping() && !this.popupExpanded() && val.trim().length > 0) {
      this.openPopup();
    }
  }

  /**
   * Synchronizes popup expansion state emitted by ngCombobox directive.
   *
   * @param expanded - New expansion state from ngCombobox.
   */
  protected onExpandedChange(expanded: boolean): void {
    if (!expanded) {
      this.closePopup();
    } else if (this.openOnTyping()) {
      this.openPopup();
    }
  }

  /** Opens dropdown on input click when allowed. */
  protected onInputClick(): void {
    if (this.variant() !== 'search' && this.openOnClick()) {
      this.openPopup();
    }
  }

  /** Toggles popup visibility. */
  protected togglePopup(): void {
    if (this.popupExpanded()) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  /** Opens the dropdown popup and recalculates overlay direction. */
  public openPopup(): void {
    this.updateOverlayDirection();
    this.popupExpanded.set(true);
  }

  /** Closes the dropdown popup. */
  public closePopup(): void {
    this.popupExpanded.set(false);
  }

  /** Checks whether an option is currently selected. */
  protected isSelected(item: T): boolean {
    if (this.variant() === 'search') return false;
    return this.selectedKeys().includes(this.valueKey()(item));
  }

  /** Handles selection changes emitted by `ngListbox`. */
  protected onValueChange(selected: any[]): void {
    if (this.multi()) {
      this.mergeMultiSelection(selected);
    } else if (this.variant() === 'search') {
      this.handleSearchPick(selected);
    } else {
      this.updateValue(selected[0] ?? null);
      this.closePopup();
    }
  }

  /** Removes a key from the selection programmatically. */
  public deselect(key: any): void {
    if (this.multi()) {
      this.updateValue(this.selectedKeys().filter((k) => k !== key));
    } else {
      this.updateValue(null);
    }
  }

  /** Returns error message string if invalid and touched. */
  protected showError(): string | null {
    const ctrl = this.ngControl?.control;
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    const errors =
      this.requiredMsg() && ctrl.errors?.['required'] ? { requiredDefault: true } : ctrl.errors;
    return this.errorService.getErrorMessage(errors, this.label() ?? '');
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /** Merges newly selected visible keys with previously hidden selected keys. */
  private mergeMultiSelection(selected: any[]): void {
    const visibleKeys = new Set(this.filteredOptions().map((opt) => this.valueKey()(opt)));
    const hiddenSelectedKeys = this.selectedKeys().filter((key) => !visibleKeys.has(key));
    this.updateValue([...hiddenSelectedKeys, ...selected]);
  }

  /** Emits picked key in search mode and resets value in microtask. */
  private handleSearchPick(selected: any[]): void {
    const picked = selected[0] ?? null;
    if (picked != null) {
      this.value.set(picked);
      queueMicrotask(() => this.value.set(null));
    }
    this.closePopup();
  }

  /** Recalculates preferred overlay direction based on available viewport space. */
  private updateOverlayDirection(): void {
    const el = this.trigger()?.elementRef.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      this.positions.set([this.positionAbove, this.positionBelow]);
    } else {
      this.positions.set([this.positionBelow, this.positionAbove]);
    }
  }

  /** Updates internal value signal and notifies form control. */
  private updateValue(val: any): void {
    this.value.set(val);
    this.onChange(val);
  }

  /** Sets up popup effects for touch reporting and search term reset. */
  private initPopupEffects(): void {
    effect(() => {
      const open = this.popupExpanded();
      if (this.wasOpen && !open) this.onTouched();
      this.wasOpen = open;
    });

    effect(() => {
      if (!this.popupExpanded() && this.variant() !== 'search') {
        this.searchTerm.set('');
        const element = this.inputField()?.nativeElement;
        if (element) element.value = this.displayValue();
      }
    });
  }

  /** Subscribes to FormControl events to refresh error display. */
  private initControlEventsEffect(): void {
    effect((onCleanUp) => {
      const ctrl = this.ngControl?.control;
      if (ctrl) {
        const sub = ctrl.events.subscribe(() => {
          this.cdr.markForCheck();
        });
        onCleanUp(() => sub.unsubscribe());
      }
    });
  }
}
