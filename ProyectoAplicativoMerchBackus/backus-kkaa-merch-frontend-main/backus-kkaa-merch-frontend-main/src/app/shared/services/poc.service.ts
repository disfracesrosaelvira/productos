import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PocService {

  constructor(private http: HttpClient) { }

  getPocs(): Observable<any> {
    return this.http.get<any>(`${environment.backendUrl}/api/v1/pocs-no-paginate`);
  }
}
