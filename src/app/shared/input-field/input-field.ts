import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-input-field',
  styleUrl: './input-field.scss',
  templateUrl: './input-field.html',
})
export class InputField {
  label = input<string>('');
  forId = input<string>('');
  icon = input<string>('');
}
