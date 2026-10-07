import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IFrenteResponse } from '../../dto/frente.dto';

@Injectable({
  providedIn: 'root',
})
export class FrenteReportsService {
  constructor(private http: HttpClient) {}

  async getFrentes(
    user_id: string,
    pageIndex: number,
    pageSize: number,
    filterStartDate: string,
    filterEndDate: string
  ): Promise<IFrenteResponse> {
    let params = new HttpParams()
      .set('user_id', user_id)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('filterStartDate', filterStartDate)
      .set('filterEndDate', filterEndDate);
    //   .set('is_paginate', true);
    try {
      const obs$ = this.http.get<IFrenteResponse>(
        `${environment.backendUrl}/api/v1/frentes`,
        { params }
      );
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public exportExcel(
    user_id: string,
    filterStartDate: string,
    filterEndDate: string
  ): Observable<Blob> {
    let params = new HttpParams()
      .set('user_id', user_id)
      .set('filterStartDate', filterStartDate)
      .set('filterEndDate', filterEndDate);
    return this.http.get(`${environment.backendUrl}/api/v1/download/frente`, {
      params,
      responseType: 'blob',
    });
  }
}

// para la coleccion de frente
// db.frente
//   .find(
//     { 'skus.linea': null }, // Condición para encontrar documentos con "linea" igual a null en algún elemento del array "skus"
//     { _id: 1 } // Proyección para obtener solo el campo "_id"
//   )
//   .toArray();

// const skuLineaMarca = [
//   {
//     linea: 'Cervezas',
//     marcas: ['Amstel', 'Heineken', 'Pum Pum', 'Tres Cruces'],
//     empresa_id: 'BK',
//     estado: 1,
//     competencia: 1,
//   },
//   {
//     linea: 'Cervezas',
//     marcas: [
//       'Arequipeña',
//       'Barbarian',
//       'Budweiser',
//       'Corona',
//       'Cristal',
//       'Cusqueña',
//       'Golden',
//       'Pacífico',
//       'Pilsen Callao',
//       'Pilsen Trujillo',
//       'San Juan',
//       'Stella',
//     ],
//     empresa_id: 'BK',
//     estado: 1,
//     competencia: 0,
//   },
//   {
//     linea: 'NABs',
//     marcas: ['Guaraná', 'San Mateo', 'Viva'],
//     empresa_id: 'BK',
//     estado: 1,
//     competencia: 0,
//   },
//   {
//     linea: 'RTD',
//     marcas: ['Corona Tropical', 'Mikes', 'Beats'],
//     empresa_id: 'BK',
//     estado: 1,
//     competencia: 0,
//   },
//   {
//     linea: 'Gin',
//     marcas: ['Tanqueray'],
//     empresa_id: 'PE',
//     estado: 1,
//     competencia: 1,
//   },
//   {
//     linea: 'Gin',
//     marcas: ['Beefeater', 'Monkey 47'],
//     empresa_id: 'PE',
//     estado: 1,
//     competencia: 0,
//   },
//   {
//     linea: 'Ron',
//     marcas: ['Flor de Caña', 'Zacapa'],
//     empresa_id: 'PE',
//     estado: 1,
//     competencia: 1,
//   },
//   {
//     linea: 'Ron',
//     marcas: ['Havana Club', 'Malibu', 'Hechicera'],
//     empresa_id: 'PE',
//     estado: 1,
//     competencia: 0,
//   },
//   {
//     linea: 'Vodka',
//     marcas: ['Absolut', 'Wyborowa'],
//     empresa_id: 'PE',
//     estado: 1,
//     competencia: 0,
//   },
//   {
//     linea: 'Whisky',
//     marcas: ['Johnnie Walker', 'Old Parr', 'Singleton'],
//     empresa_id: 'PE',
//     estado: 1,
//     competencia: 1,
//   },
//   {
//     linea: 'Whisky',
//     marcas: [
//       "Ballantine's",
//       'Chivas',
//       'Jameson',
//       'Passport',
//       'Something',
//       'The Glenlivet',
//     ],
//     empresa_id: 'PE',
//     estado: 1,
//     competencia: 0,
//   },
// ];

// { _id: ObjectId('66d85d5e825459ef0a535db4') },
// { _id: ObjectId('66d862e4825459ef0a535f84') },
// { _id: ObjectId('66d864a5825459ef0a536135') },
// { _id: ObjectId('66d86551825459ef0a5361d2') },
// { _id: ObjectId('66d866d9825459ef0a53627f') },
// { _id: ObjectId('66d86856825459ef0a53632d') },
// { _id: ObjectId('66d86d1a825459ef0a5364f2') },
// { _id: ObjectId('66d87302825459ef0a536677') },
// { _id: ObjectId('66d879a5825459ef0a5369f3') },
// { _id: ObjectId('66d87a0c825459ef0a536a1f') },
// { _id: ObjectId('66d87ce6825459ef0a536b89') },
// { _id: ObjectId('66d87d5f825459ef0a536be8') },

// db.frente.updateMany(
//   {
//     skus: {
//       $elemMatch: { linea: null } // Filtra documentos donde al menos un SKU no tiene definida la línea
//     }
//   },
//   [
//     {
//       $set: {
//         skus: {
//           $map: {
//             input: "$skus",
//             as: "sku",
//             in: {
//               $mergeObjects: [
//                 "$$sku",
//                 {
//                   linea: {
//                     $let: {
//                       vars: {
//                         matchedLinea: {
//                           $arrayElemAt: [
//                             {
//                               $filter: {
//                                 input: skuLineaMarca,
//                                 as: "lineaInfo",
//                                 cond: {
//                                   $and: [
//                                     { $eq: ["$$lineaInfo.estado", 1] },
//                                     {
//                                       $in: ["$$sku.marca", "$$lineaInfo.marcas"]
//                                     }
//                                   ]
//                                 }
//                               }
//                             },
//                             0 // Toma el primer elemento coincidente
//                           ]
//                         }
//                       },
//                       in: {
//                         $ifNull: ["$$matchedLinea.linea", null] // Agrega línea si hay coincidencia
//                       }
//                     }
//                   }
//                 }
//               ]
//             }
//           }
//         }
//       }
//     }
//   ]
// );

// para la coleccion de frente