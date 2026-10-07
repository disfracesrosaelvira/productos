import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class CargarService {

  constructor(private http: HttpClient) {
  }

  public async fileInput(data: any): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/upload-data`, data, {});
      const result = await firstValueFrom(obs$);
      console.log(result);
      return result;
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }

  importFromFile(bstr: string): any[] {
    /* read workbook */
    const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
    /* grab first sheet */
    const wsname: string = wb.SheetNames[0];
    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
    /* save data */
    const data = <any[]>(XLSX.utils.sheet_to_json(ws, { header: 1 }));
    return data;
  }

}
