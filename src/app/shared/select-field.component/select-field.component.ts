import {
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  model,
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

let nextId = 0;

/**
 * Generic, accessible select and autocomplete combobox component built on top of
 * `@angular/aria/combobox`, `@angular/aria/listbox`, and `@angular/cdk/overlay`.
 *
 * Supports three primary usage modes:
 * 1. **Multi-Select with Custom Template** (e.g., assigning contacts with avatars, checkboxes, and a footer).
 * 2. **Single-Select Dropdown** (e.g., selecting a task category).
 * 3. **Search / Autocomplete Input** (`variant="search"`, e.g., finding tasks with a divider and magnifying glass icon).
 *
 * ### Data binding
 * `[(value)]` is a `model()`, so it supports two-way binding (`[(value)]="..."`) as well as
 * one-way input + `(valueChange)` output usage. The value always contains option *keys*
 * (see `valueKey`), never the option objects themselves:
 * - `multi = true`: an array of keys (e.g. `number[]`).
 * - `multi = false`: a single key or `null`.
 * - `variant = 'search'`: a transient key. It is emitted once per pick and then reset to `null`
 *   (so `(valueChange)` fires twice per pick: first with the key, then with `null`).
 *
 * ### Projected content
 * - `<ng-template #optionTemplate let-item let-selected="selected">`: optional template that
 *   replaces the default row rendering (`labelFn(item)`). `$implicit` is the option item,
 *   `selected` tells whether it is part of the current selection.
 * - `[footer]`: any element carrying the `footer` attribute is projected below the input
 *   (`<ng-content select="[footer]" />`), e.g. a row of avatars for the current selection.
 *
 * ### Programmatic control
 * The public method {@link SelectFieldComponent.deselect} removes a key from the selection.
 * Typically a parent exposes the component via a template reference variable and calls it
 * from the footer content, e.g. when an avatar-group emits the id of a removed user:
 * `(userDeletedId)="assignedSelect.deselect($event)"` (see example 2).
 *
 * @example
 * ### 1. Simple Single-Select (Strings)
 * ```html
 * <app-select-field
 *   label="Category"
 *   placeholder="Select task category"
 *   [options]="['Technical Task', 'User Story']"
 *   [(value)]="selectedCategory"
 * />
 * ```
 *
 * @example
 * ### 2. Multi-Select with Custom Option Template & Footer
 * ```html
 * <app-select-field
 *   #assignedSelect
 *   label="Assigned to"
 *   placeholder="Select contacts to assign"
 *   [options]="contacts()"
 *   [multi]="true"
 *   [(value)]="selectedContactIds"
 *   [getSearchStrings]="contactSearchStrings"
 * >
 *   <ng-template #optionTemplate let-contact let-selected="selected">
 *     <app-user-avatar [user]="contact" size="medium" />
 *     <span class="name">{{ contact.firstname }} {{ contact.surname }}</span>
 *     <!-- The checkbox only mirrors the selection state; toggling is handled by the listbox (row click / Enter / Space). -->
 *     <app-checkbox [checked]="selected" />
 *   </ng-template>
 *
 *   <!-- Projected into the [footer] slot; removing a user deselects the key in the select field. -->
 *   <app-avatar-group
 *     footer
 *     [users]="selectedContacts()"
 *     size="medium"
 *     [overlapLayout]="false"
 *     (userDeletedId)="assignedSelect.deselect($event)"
 *   />
 * </app-select-field>
 * ```
 *
 * @example
 * ### 3. Task Searchbar (`variant="search"`)
 * ```html
 * <app-select-field
 *   variant="search"
 *   placeholder="Find Task"
 *   emptyText="No tasks found."
 *   [options]="taskService.tasks()"
 *   [labelFn]="taskLabelFn"
 *   [getSearchStrings]="taskTitleSearch"
 *   [getIncludeStrings]="taskDescriptionSearch"
 *   (valueChange)="onTaskSelected($event)"
 * />
 * ```
 * In search mode `valueChange` is emitted twice per pick (the picked key, then `null`), so
 * the handler (`onTaskSelected`) should ignore `null`.
 *
 * @typeParam T - The data type of the option items passed to `[options]`.
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
export class SelectFieldComponent<T = any> {
  /** Service used to adapt label styling to mobile/desktop viewports. */
  responsiveService = inject(ResponsiveService);

  // ---------------------------------------------------------------------------
  // Inputs & Two-Way Models
  // ---------------------------------------------------------------------------

  /** Unique HTML id attribute for the underlying input element (also used as the `for` target of the label). */
  fieldId = input<string>(`app-select-${nextId++}`);

  /** Optional label text displayed above the select input. */
  label = input<string>();

  /** Placeholder text shown inside the input when no value is displayed. */
  placeholder = input<string>('Select an option');

  /** Fallback message displayed inside the dropdown when filtering yields no matches. */
  emptyText = input<string>('No results found.');

  /** Full list of selectable items of type `T`. */
  options = input<T[]>([]);

  /**
   * Visual and behavioral variant of the component:
   * - `'select'` (default): Standard dropdown with a rotating arrow icon that opens on click.
   * - `'search'`: Searchbar with a vertical divider and magnifying glass icon that opens only
   *   when typing and clears the input field after a result is selected.
   */
  variant = input<'select' | 'search'>('select');

  /** Whether multiple options can be selected simultaneously (`true`) or only one (`false`). */
  multi = input<boolean>(false);

  /**
   * Whether clicking the input field immediately opens the dropdown popup.
   * Automatically ignored when `variant()` is `'search'`.
   */
  openOnClick = input<boolean>(true);

  /**
   * Two-way bound selection value.
   * - In `multi` mode: holds an array of selected keys (e.g., `number[]`).
   * - In single-select / search mode: holds the single selected key/value (e.g., `string | number | null`).
   * - In search mode the value is transient: it is set to the picked key and reset to `null`
   *   right afterwards (see `onValueChange`), so `(valueChange)` emits the key and then `null`.
   *
   * Bind with `[(value)]="..."` for two-way binding, or listen to `(valueChange)` only.
   */
  value = model<any>();

  /**
   * Extracts a unique primitive identifier from an option item for selection comparison and tracking.
   * Defaults to `item.id` if present on an object, or the item itself for primitives.
   */
  valueKey = input<(item: T) => any>((item: any) =>
    item && typeof item === 'object' && 'id' in item ? item.id : item,
  );

  /**
   * Formats an option item into a human-readable string for default option rendering
   * and for displaying the selected value inside the input in single-select mode.
   */
  labelFn = input<(item: T) => string>((item: any) =>
    typeof item === 'string' ? item : (item?.name ?? ''),
  );

  /**
   * Extracts the array of searchable strings from an option item that should be matched
   * via case-insensitive `startsWith()` against `searchTerm()` (e.g., contact names or task titles).
   */
  getSearchStrings = input<(item: T) => (string | undefined | null)[]>((item: any) => [
    typeof item === 'string' ? item : (item?.name ?? ''),
  ]);

  /**
   * Optional extractor for additional strings on an option item that should be matched
   * via case-insensitive `includes()` against `searchTerm()` (e.g., task descriptions).
   */
  getIncludeStrings = input<((item: T) => (string | undefined | null)[]) | undefined>(undefined);

  required = input<boolean>(false);

  // ---------------------------------------------------------------------------
  // Content & View Queries
  // ---------------------------------------------------------------------------

  /**
   * Optional custom `<ng-template #optionTemplate let-item let-selected="selected">`
   * projected by the parent component to customize how each dropdown row is rendered.
   */
  optionTemplate = contentChild<TemplateRef<{ $implicit: T; selected: boolean }>>('optionTemplate');

  /** Reference to the native text input element used to clear/sync its DOM value on close. */
  inputField = viewChild<ElementRef<HTMLInputElement>>('inputField');

  /** Reference to the CDK overlay origin container used for dropdown positioning and width calculation. */
  readonly trigger = viewChild<CdkOverlayOrigin>('trigger');

  // ---------------------------------------------------------------------------
  // Internal State & Computed Signals
  // ---------------------------------------------------------------------------

  /** Current search query typed into the combobox input. */
  searchTerm = signal<string>('');

  /** Whether the CDK overlay dropdown popup is currently open. */
  popupExpanded = signal<boolean>(false);

  /**
   * Overlay position that opens the dropdown above the input (overlay bottom-start attached to
   * origin top-start). Used by `positions`, whose order is decided in `updateOverlayDirection()`.
   */
  private readonly positionAbove: ConnectedPosition = {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
  };

  /** Overlay position that opens the dropdown below the input (overlay top-start attached to origin bottom-start). */
  private readonly positionBelow: ConnectedPosition = {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
  };

  /**
   * Ordered list of preferred CDK overlay positions bound to `cdkConnectedOverlayPositions`.
   * The first entry is tried first; the order is recalculated on every `openPopup()`
   * (below first by default, above first when there is not enough room below).
   */
  positions = signal<ConnectedPosition[]>([this.positionBelow, this.positionAbove]);

  /**
   * Options filtered reactively by the current `searchTerm()` using `getSearchStrings()` (`startsWith`)
   * and optional `getIncludeStrings()` (`includes`).
   */
  filteredOptions = computed(() =>
    filterInput(
      this.options(),
      this.searchTerm(),
      this.getSearchStrings(),
      this.getIncludeStrings(),
    ),
  );

  /**
   * Normalized array of all currently selected keys from `value()`,
   * regardless of whether those options are currently visible in `filteredOptions()`.
   */
  selectedKeys = computed<any[]>(() => {
    const current = this.value();
    if (current == null || current === '') return [];
    return Array.isArray(current) ? current : [current];
  });

  /**
   * Subset of `selectedKeys()` that are currently rendered in `filteredOptions()`.
   * - In `'search'` variant: always returns `[]` so results act as action triggers that can be re-selected at any time.
   * - In `'select'` variant: prevents `@angular/aria/listbox` from stripping out selected items hidden by the search filter.
   *
   * Why it exists: the listbox only knows the options that are currently rendered. If `value()`
   * were passed directly, keys of selected options that are filtered out by the search term would
   * be unknown to the listbox and dropped from its internal value on the next change.
   * Passing only the visible subset keeps the listbox consistent; `onValueChange()` re-adds the
   * hidden selected keys afterwards. Bound to `[value]` of `ngListbox` in the template.
   * In search mode an empty value ensures no row is ever shown as selected, so picking the
   * same result again always counts as a new selection.
   */
  listboxValue = computed<any[]>(() => {
    if (this.variant() === 'search') return [];

    const visibleKeys = new Set(this.filteredOptions().map((opt) => this.valueKey()(opt)));
    return this.selectedKeys().filter((key) => visibleKeys.has(key));
  });

  /**
   * Text value displayed inside the `<input>` element:
   * - In `multi` or `'search'` mode: displays only the active `searchTerm()`.
   * - In single-select mode: displays `searchTerm()` while actively searching, or the formatted label of the selected option.
   */
  displayValue = computed(() => {
    if (this.multi() || this.variant() === 'search') {
      return this.searchTerm();
    }
    if (this.popupExpanded() && this.searchTerm()) {
      return this.searchTerm();
    }
    const currentVal = this.value();
    if (currentVal == null || currentVal === '') return '';
    const matchedOption = this.options().find((opt) => this.valueKey()(opt) === currentVal);
    return this.labelFn()(matchedOption ?? currentVal);
  });

  /**
   * Initializes an effect that resets the search term and restores the input display value
   * whenever the dropdown popup closes (whether via arrow click, Escape key, selection, or outside click).
   *
   * Because the effect also reads `displayValue()` and `inputField()`, it re-runs when the selection
   * changes while the popup is closed. It writes the value directly to the native input, because the
   * `[value]` binding alone does not overwrite text the user has typed into the field.
   */
  constructor() {
    effect(() => {
      if (!this.popupExpanded()) {
        this.searchTerm.set('');
        const element = this.inputField()?.nativeElement;
        if (element) element.value = this.displayValue();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // User Interaction & Popup Control Methods
  // ---------------------------------------------------------------------------

  /**
   * Updates `searchTerm` as the user types and automatically opens the dropdown
   * if it was closed (e.g., in `'search'` mode or when `[openOnClick]="false"`).
   *
   * @param event - The DOM `input` event from the text field.
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);

    if (!this.popupExpanded() && value.trim().length > 0) {
      this.openPopup();
    }
  }

  /**
   * Opens the dropdown when clicking into the input field, unless `variant()` is `'search'`
   * or `openOnClick()` is explicitly disabled.
   */
  onInputClick(): void {
    if (this.variant() !== 'search' && this.openOnClick()) {
      this.openPopup();
    }
  }

  /**
   * Toggles the visibility of the dropdown popup when clicking the arrow button
   * (or the magnifying glass button in the `'search'` variant).
   */
  togglePopup(): void {
    if (this.popupExpanded()) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  /**
   * Recalculates available viewport space above/below the input and opens the dropdown popup.
   */
  openPopup(): void {
    this.updateOverlayDirection();
    this.popupExpanded.set(true);
  }

  /**
   * Closes the dropdown popup. The constructor effect will automatically reset `searchTerm`.
   */
  closePopup(): void {
    this.popupExpanded.set(false);
  }

  /**
   * Checks whether a given option item is currently part of the selection.
   * Always returns `false` in `'search'` mode since search results are transient actions.
   *
   * Used by the template to apply the `.selected` class to a row and to pass `selected`
   * into the context of a custom `#optionTemplate`.
   *
   * @param item - The option item to check.
   * @returns `true` if the item's key is included in `selectedKeys()`, otherwise `false`.
   */
  isSelected(item: T): boolean {
    if (this.variant() === 'search') return false;
    return this.selectedKeys().includes(this.valueKey()(item));
  }

  /**
   * Handles selection changes emitted by `ngListbox` (via keyboard Enter/Space or row click).
   * - In `multi` mode: merges the updated visible selection with any previously selected keys
   *   that are currently hidden by the active search filter.
   * - In `'search'` mode: emits the selected key, resets `value` to `null` so the same item
   *   can be selected again later, and closes the popup.
   * - In single-select mode: emits the selected key and closes the popup.
   *
   * Why it exists: the listbox only receives (and reports) the keys of the currently visible
   * options (see `listboxValue`). In multi mode, writing its result directly into `value` would
   * silently discard selections that are hidden by the search term, so those are merged back
   * (`[...hiddenSelectedKeys, ...selected]`). In search mode the component acts as an action
   * trigger rather than a form field: the picked key is emitted and `value` is reset to `null`
   * in a microtask, so no selection is retained. In single mode the popup is closed after a pick
   * (the constructor effect then resets the search term and shows the label of the selection).
   *
   * @param selected - Array of selected visible keys emitted by `ngListbox`.
   */
  onValueChange(selected: any[]): void {
    if (this.multi()) {
      const visibleKeys = new Set(this.filteredOptions().map((opt) => this.valueKey()(opt)));
      const hiddenSelectedKeys = this.selectedKeys().filter((key) => !visibleKeys.has(key));
      this.value.set([...hiddenSelectedKeys, ...selected]);
    } else if (this.variant() === 'search') {
      const picked = selected[0] ?? null;
      if (picked != null) {
        this.value.set(picked);
        queueMicrotask(() => this.value.set(null));
      }
      this.closePopup();
    } else {
      this.value.set(selected[0] ?? null);
      this.closePopup();
    }
  }

  /**
   * Removes a key from the current selection programmatically (e.g., from the `[footer]` slot).
   * - In `multi` mode: removes `key` from the array in `value()` and keeps all other keys.
   * - In single-select / search mode: clears the value (`null`), regardless of `key`.
   * The popup state is not changed.
   *
   * Typical usage from a parent template, via a template reference variable on the select field:
   * ```html
   * <app-select-field #assignedSelect [multi]="true" [(value)]="selectedIds" [options]="contacts()">
   *   <app-avatar-group
   *     footer
   *     [users]="selectedContacts()"
   *     [overlapLayout]="false"
   *     (userDeletedId)="assignedSelect.deselect($event)"
   *   />
   * </app-select-field>
   * ```
   *
   * @param key - The option key (as returned by `valueKey`) to remove from the selection.
   */
  deselect(key: any) {
    if (this.multi()) {
      this.value.set(this.selectedKeys().filter((k) => k !== key));
    } else {
      this.value.set(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Determines whether the dropdown should open downwards or upwards depending on
   * the remaining viewport space below the trigger element.
   */
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
}
