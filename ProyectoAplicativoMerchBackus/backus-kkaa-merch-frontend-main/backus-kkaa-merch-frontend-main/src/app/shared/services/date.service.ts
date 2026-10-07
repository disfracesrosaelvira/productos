import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {

  constructor() { }

  generateFormattedDateForExport(): string {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    let formattedDate = `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
    return formattedDate;
  }

  generateFormattedDate(date: Date): string {
    // const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    // const hh = String(date.getHours()).padStart(2, '0');
    // const min = String(date.getMinutes()).padStart(2, '0');
    // const ss = String(date.getSeconds()).padStart(2, '0');
    let formattedDate = `${yyyy}-${mm}-${dd}`;
    return formattedDate;
  }
}
