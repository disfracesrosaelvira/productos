import { IDicPoc, IDicSkuStock, IDicUsuario } from "./dictionary.dto";

export interface IStock {
  stock_id: string;
  skus: IDicSkuStock[];
  latitud: number;
  longitud: Number;
  poc: IDicPoc;
  usuario: IDicUsuario;
  empresa_id: string;
  fecha_creacion: string;
  offline?: number;
}

  export interface IStockResponse {
    docs: IStock[];
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