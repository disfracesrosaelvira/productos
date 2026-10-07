import { IDicPoc, IDicSkuPrice, IDicUsuario } from "./dictionary.dto";

export interface IPrice {
    precio_id: string;
    skus: IDicSkuPrice[];
    latitud: Number;
    longitud: Number;
    empresa_id: string;
    poc: IDicPoc;
    usuario: IDicUsuario;
    fecha_creacion: Date;
    offline?: number;
}

export interface IPriceResponse {
    docs: IPrice[];
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