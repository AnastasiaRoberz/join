import { Component, OnInit } from '@angular/core';
import { Button } from '../../interfaces/button';
import { Buttons } from '../../shared/buttons/buttons';
import { BUTTON_STYLES } from '../../shared/buttons/buttons.config';

type ButtonPresetEntry = Button & { name: string };

@Component({
  imports: [Buttons],
  selector: 'app-cheatsheet',
  standalone: true,
  styleUrl: './cheatsheet.scss',
  templateUrl: './cheatsheet.html',
})
export class Cheatsheet implements OnInit {
  activeTab: 'icons' | 'buttons' = 'icons';
  icons: string[] = [];
  iconLoadError: string | null = null;
  readonly iconSpriteUrl = new URL('assets/icons/icons.svg', document.baseURI).href;
  readonly buttonPresets: ButtonPresetEntry[] = (
    Object.keys(BUTTON_STYLES) as (keyof typeof BUTTON_STYLES)[]
  ).map((name) => ({ name, ...BUTTON_STYLES[name] }));

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch(this.iconSpriteUrl);
      if (!response.ok) {
        throw new Error(`Icons konnten nicht geladen werden (HTTP ${response.status}).`);
      }

      const source = await response.text();
      const sprite = new DOMParser().parseFromString(source, 'image/svg+xml');
      if (sprite.querySelector('parsererror')) {
        throw new Error('Die icons.svg-Datei ist kein gültiges SVG.');
      }

      this.icons = [...sprite.querySelectorAll('symbol[id]')].map((symbol) => symbol.id);
      if (this.icons.length === 0) {
        throw new Error('In icons.svg wurden keine SVG-IDs gefunden.');
      }
    } catch (error) {
      this.iconLoadError =
        error instanceof Error ? error.message : 'Die Icons konnten nicht geladen werden.';
    }
  }
}
