import { Pipe, PipeTransform } from '@angular/core';
import { format, toZonedTime } from 'date-fns-tz';

const FUSO = 'America/Sao_Paulo';

@Pipe({
  name: 'dateBr',
  standalone: true
})
export class DateBrPipe implements PipeTransform {

  /** Formata no fuso de São Paulo; devolve vazio para valor ausente ou data inválida. */
  transform(value: string | Date | null | undefined, pattern = 'dd/MM/yyyy HH:mm'): string {
    if (!value) return '';

    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    return format(toZonedTime(date, FUSO), pattern, { timeZone: FUSO });
  }
}
