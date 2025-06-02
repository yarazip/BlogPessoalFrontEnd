import { Pipe, PipeTransform } from '@angular/core';
import { format, toZonedTime } from 'date-fns-tz';

@Pipe({
  name: 'dateBr',
  standalone: true 
})
export class DateBrPipe implements PipeTransform {
  
  transform(value: string | Date, pattern: string = 'dd/MM/yyyy HH:mm'): string {
    if (!value) return '';

    const timeZone = 'America/Sao_Paulo';
    const date = new Date(value);

    const zonedDate = toZonedTime(date, timeZone);
    return format(zonedDate, pattern, { timeZone });
  }
}
