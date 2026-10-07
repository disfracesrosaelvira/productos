import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrecioDashboardService {

  constructor(private http: HttpClient) { }

  getPrecioCountsByBrandAndDescriptionByMonthAndWeek(filters: any, marcas: string []): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters))
    if (marcas.length > 0) {
      params = params.set('marcas', JSON.stringify(marcas));
    }
    return this.http.get<any>(`${environment.backendUrl}/api/v1/precio/counts-by-brand-and-description-month-and-week`, { params });
  }

  getPrecioAveragesByBrandAndDescriptionByMonthAndWeek(filters: any): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters))
    return this.http.get<any>(`${environment.backendUrl}/api/v1/precio/averages-by-brand-and-description-month-and-week`, { params });
  }

  getStoresWithProductsPromotionalPrice(filters: any): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters))
    return this.http.get<any>(`${environment.backendUrl}/api/v1/precio/stores-with-promotional-price`, { params });
  }

  public exportExcelPrecioCountsByBrandAndDescriptionByMonthAndWeek(filters: any, marcas: string []): Observable<Blob> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    if (marcas.length > 0) {
      params = params.set('marcas', JSON.stringify(marcas));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/precio/counts-by-brand-and-description-month-and-week`, { params, responseType: 'blob' });
  }

  exportExcelPrecioAveragesByBrandAndDescriptionByMonthAndWeek(filters: any): Observable<Blob> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get(`${environment.backendUrl}/api/v1/download/precio/averages-by-brand-and-description-month-and-week`, { params, responseType: 'blob' });
  }

  exportExcelPrecioStoresWithProductsPromotionalPrice(filters: any): Observable<Blob> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get(`${environment.backendUrl}/api/v1/download/precio/stores-with-promotional-price`, { params, responseType: 'blob' });
  }
}

// const lineasObj = {
//   "Cervezas": [
//       "Amstel",
//       "Heineken",
//       "Pum Pum",
//       "Tres Cruces",
//       "Arequipeña",
//       "Barbarian",
//       "Budweiser",
//       "Corona",
//       "Cristal",
//       "Cusqueña",
//       "Golden",
//       "Pacífico",
//       "Pilsen Callao",
//       "Pilsen Trujillo",
//       "San Juan",
//       "Stella"
//   ],
//   "NABs": [
//       "Guaraná",
//       "San Mateo",
//       "Viva"
//   ],
//   "RTD": [
//       "Corona Tropical",
//       "Mikes",
//       "Beats"
//   ],
//   "Gin": [
//       "Tanqueray",
//       "Beefeater",
//       "Monkey 47"
//   ],
//   "Ron": [
//       "Flor de Caña",
//       "Zacapa",
//       "Havana Club",
//       "Malibu",
//       "Hechicera"
//   ],
//   "Vodka": [
//       "Absolut",
//       "Wyborowa"
//   ],
//   "Whisky": [
//       "Johnnie Walker",
//       "Old Parr",
//       "Singleton",
//       "Ballantine's",
//       "Chivas",
//       "Jameson",
//       "Passport",
//       "Something",
//       "The Glenlivet"
//   ]
// }

// db.exhibicion_adicional.aggregate([
//   {
//     $addFields: {
//       skus: {
//         $map: {
//           input: "$skus",
//           as: "sku",
//           in: {
//             $mergeObjects: [
//               "$$sku",
//               {
//                 linea: {
//                   $reduce: {
//                     input: { $objectToArray: lineasObj },  // Convertir el objeto en un array de pares clave-valor
//                     initialValue: "",
//                     in: {
//                       $cond: {
//                         if: { $in: ["$$sku.marca", "$$this.v"] },  // Verificar si la marca está en la lista de una línea
//                         then: "$$this.k",  // Si coincide, usar la clave (nombre de la línea)
//                         else: "$$value"   // Si no coincide, mantener el valor actual
//                       }
//                     }
//                   }
//                 }
//               }
//             ]
//           }
//         }
//       }
//     }
//   },
//   {
//     $merge: {
//       into: "exhibicion_adicional",  // Actualiza la colección original
//       whenMatched: "merge",          // Hace merge si hay coincidencias
//       whenNotMatched: "discard"      // Si no hay coincidencias, descarta los documentos
//     }
//   }
// ]);

///////
// db.exhibicion_competencia.aggregate([
//   {
//     $addFields: {
//       skus: {
//         $map: {
//           input: "$skus",
//           as: "sku",
//           in: {
//             $mergeObjects: [
//               "$$sku",
//               {
//                 linea: {
//                   $reduce: {
//                     input: { $objectToArray: lineasObj },  // Convertir el objeto en un array de pares clave-valor
//                     initialValue: "",
//                     in: {
//                       $cond: {
//                         if: { $in: ["$$sku.marca", "$$this.v"] },  // Verificar si la marca está en la lista de una línea
//                         then: "$$this.k",  // Si coincide, usar la clave (nombre de la línea)
//                         else: "$$value"   // Si no coincide, mantener el valor actual
//                       }
//                     }
//                   }
//                 }
//               }
//             ]
//           }
//         }
//       }
//     }
//   },
//   {
//     $merge: {
//       into: "exhibicion_competencia",  // Actualiza la colección original
//       whenMatched: "merge",          // Hace merge si hay coincidencias
//       whenNotMatched: "discard"      // Si no hay coincidencias, descarta los documentos
//     }
//   }
// ]);
