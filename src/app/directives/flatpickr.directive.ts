import { Directive, ElementRef, inject, OnDestroy, OnInit, output, signal } from '@angular/core';
import flatpickr from 'flatpickr';

@Directive({
  selector: '[appFlatpickr]',
  standalone: true,
  exportAs: 'appFlatpickr',
})
export class FlatpickrDirective implements OnInit, OnDestroy {
  element = inject(ElementRef<HTMLInputElement>);
  pickerInstance?: flatpickr.Instance;

  dateChanged = output<string>();
  isOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.pickerInstance = flatpickr(this.element.nativeElement, {
      positionElement: this.element.nativeElement.parentElement,
      position: 'auto center',
      monthSelectorType: 'static',
      dateFormat: 'd/m/Y',
      minDate: 'today',
      weekNumbers: true,
      disableMobile: true,
      allowInput: true,
      // clickOpens: false,
      nextArrow: /*html*/ `
        <svg>
          <use href="./assets/icons/icons.svg#arrow-down"></use>
      </svg>
      `,
      prevArrow: /*html*/ `
        <svg>
          <use href="./assets/icons/icons.svg#arrow-down"></use>
      </svg>
      `,
      parseDate: (dateStr: string) => {
        return this.parseFlexibleDate(dateStr.trim());
      },
      onChange: (selectedDates, dateStr, instance) => this.dateChanged.emit(dateStr),
    });
  }

  toggle(): void {
    if (!this.isOpen()) {
      this.pickerInstance?.open();
      this.isOpen.set(true);
    } else {
      this.pickerInstance?.close();
      this.isOpen.set(false);
    }
  }

  setDate(value: string): void {
    if (!value || !this.pickerInstance) return;

    const parsedDate = value.includes('-')
      ? flatpickr.parseDate(value, 'Y-m-d')
      : flatpickr.parseDate(value, 'd/m/Y');

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedDate < today) {
        this.pickerInstance.set('minDate', parsedDate);
      }
      this.pickerInstance.setDate(parsedDate, false);
    }
  }

  ngOnDestroy(): void {
    this.pickerInstance?.destroy();
  }

  private parseFlexibleDate(inputStr: string): Date {
    if (!inputStr) return new Date(NaN);

    let day = 0;
    let month = 0;
    let year = 0;

    // Fall 1: Mit Trennzeichen (z. B. 8.6.27, 08/06/2027, 8-6-2027)
    if (/[\.\/\-]/.test(inputStr)) {
      const parts = inputStr.split(/[\.\/\-]/).map((p) => parseInt(p, 10));
      if (parts.length === 3 && !parts.some(isNaN)) {
        [day, month, year] = parts;
      }
    }
    // Fall 2: Reine Zahlenfolge ohne Trennzeichen (z. B. 8627, 08062027)
    else if (/^\d{4,8}$/.test(inputStr)) {
      let rest = '';

      // Prüfen, ob das Jahr 4-stellig oder 2-stellig am Ende steht
      // Wenn die Gesamtlänge >= 7 ist (z. B. 8062027 oder 08062027), ist das Jahr 4-stellig
      // Wenn 6 Stellen vorliegen und die letzten 4 plausibel als Jahr sind (>= 2000):
      if (inputStr.length >= 7) {
        year = parseInt(inputStr.slice(-4), 10);
        rest = inputStr.slice(0, -4);
      } else if (inputStr.length === 6 && parseInt(inputStr.slice(-4), 10) >= 2000) {
        // z. B. "862027" -> Jahr 2027, rest "86"
        year = parseInt(inputStr.slice(-4), 10);
        rest = inputStr.slice(0, -4);
      } else {
        // 2-stelliges Jahr am Ende (z. B. 8627 -> 27, 080627 -> 27)
        year = parseInt(inputStr.slice(-2), 10);
        rest = inputStr.slice(0, -2);
      }

      // Tag und Monat aus dem verbleibenden Anfang extrahieren
      if (rest.length === 2) {
        // z. B. "86" -> Tag 8, Monat 6
        day = parseInt(rest[0], 10);
        month = parseInt(rest[1], 10);
      } else if (rest.length === 3) {
        // z. B. "086" -> Tag 08, Monat 6 | oder "806" -> Tag 8, Monat 06
        if (rest.startsWith('0')) {
          day = parseInt(rest.slice(0, 2), 10);
          month = parseInt(rest.slice(2), 10);
        } else {
          day = parseInt(rest.slice(0, 1), 10);
          month = parseInt(rest.slice(1), 10);
        }
      } else if (rest.length === 4) {
        // z. B. "0806" -> Tag 08, Monat 06
        day = parseInt(rest.slice(0, 2), 10);
        month = parseInt(rest.slice(2, 4), 10);
      }
    }

    // 2-stelliges Jahr in das 2000er-Jahrhundert überführen (z. B. 27 -> 2027)
    if (year < 100) {
      year += 2000;
    }

    // Validierung: Plausibler Bereich
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return new Date(year, month - 1, day);
    }

    return new Date(NaN);
  }
}
