export interface ISku {
  sku: string;
  descripcion: string;
  categoria: string;
  linea: string;
  marca: string;
  imagen: string;
  empresa_id: string;
  estado: number;
  competencia: number | string;
  usuario_id_creacion: string;
  usuario_id_actualizacion: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  _id: string;
}

  export interface ISkuResponse {
    docs: ISku[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
}