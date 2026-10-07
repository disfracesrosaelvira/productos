import { IDicImagen, IDicPoc, IDicSku, IDicUsuario } from "./dictionary.dto";

export interface IImagen {
    nombre: string;
    imagen_url: string;
    fecha_creacion: string;
}

export interface IFrente {
    frente_id: string;
    frente_total: number;
    skus: IDicSku[];
    latitud: number;
    longitud: number;
    imagenes: IDicImagen[];
    empresa_id: string;
    poc: IDicPoc;
    usuario: IDicUsuario;
    fecha_creacion: Date;
    total_cerveza: number;
    offline?: number;
}

export interface IFrenteResponse {
    docs: IFrente[];
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