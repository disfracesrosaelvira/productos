
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuExhibicionesService {
  private token: string | null;
  private headers: HttpHeaders;

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('token');
    this.headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
  }

  getDatos(): Observable<any> {
    return this.http.get<any>('assets/exhibitions_demo.json');
  }

  public async getExhibicionesContraprestadas(empresa_id: string): Promise<any> {
    try {
      const params: any = {
        empresa_id
      };  
      const obs$ = this.http.get<any>(`${environment.backendUrl}api/v1/exhibicion/contraprestada/${empresa_id}`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async getExhibicionesContraprestadasAlertasVigente(empresa_id: any,poc: any,accion:string,user_id:string): Promise<any> {
    try {  
      const params: any = {
        empresa_id, poc, accion, user_id
      };     
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada/alertas-vigente`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async updateExhibicionesContraprestadasVigente(id: string,data:any): Promise<any> {
    try {      
      const obs$ = this.http.put<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada/${id}`,data, { headers: this.headers });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async getExhibicionesAdicionales(empresa_id: string,poc:number): Promise<any> {
    try {      
      const params: any = {
        empresa_id, poc
      }; 
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/adicionales`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async getProductosAllAdicionales(empresa_id: string):Promise<any>  {
    try {
      const params: any = {
        empresa_id
      }; 
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/adicional/productos`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async deleteExhibicionAdicional(id: string):Promise<any>  {
    try {
      const params: any = { id }; 
      const obs$ = this.http.delete<any>(`${environment.backendUrl}/api/v1/exhibicion/adicional/delete`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  // public updateExhibicionAdicionalRenovar(payload: any): Observable<any>  {
  //   return this.http.patch<any>(`${environment.backendUrl}/api/v1/exhibicion/adicional/update/${payload.id}`, payload);
  // }

  public async updateExhibicionAdicionalRenovar(payload: any): Promise<any> {
    try {
      const obs$ = this.http.patch<any>(`${environment.backendUrl}/api/v1/exhibicion/adicional/update/${payload.id}`, payload);
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al actualizar la exhibición adicional:', error);
      throw error;
    }
  }

  public async getExhibicionesCompetencia(empresa_id: string,poc:number,user_id:string): Promise<any> {
    try {     
      const params: any = {
        empresa_id, poc,user_id
      }; 
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/competencias`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async getProductosAllCompetencia(empresa_id: string):Promise<any>  {
    try {
      const params: any = {
        empresa_id
      };
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/competencia/productos`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async deleteExhibicionCompetencia(id: string):Promise<any>  {
    try {
      const params: any = { id }; 
      const obs$ = this.http.delete<any>(`${environment.backendUrl}/api/v1/exhibicion/competencia/delete`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  // public updateExhibicionCompetenciaRenovar(payload: any): Observable<any>  {
  //   return this.http.patch<any>(`${environment.backendUrl}/api/v1/exhibicion/competencia/update/${payload.id}`, payload);
  // }
  public async updateExhibicionCompetenciaRenovar(payload: any): Promise<any> {
    try {
      const obs$ = this.http.patch<any>(`${environment.backendUrl}/api/v1/exhibicion/competencia/update/${payload.id}`, payload);
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al actualizar la exhibición competencia:', error);
      throw error;
    }
  }

  public async saveExhibicion(data:any): Promise<any> {
    try {      
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/exhibicion/save`,data, { headers: this.headers });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  // public async uploadFile(data:any): Promise<any> {
  //   try {      
  //     const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/photo/upload`, data);
  //     return await firstValueFrom(obs$);
  //   } catch (error) {
  //     console.error('Error al cargar los datos:', error);
  //     throw error;
  //   }
  // }
}
