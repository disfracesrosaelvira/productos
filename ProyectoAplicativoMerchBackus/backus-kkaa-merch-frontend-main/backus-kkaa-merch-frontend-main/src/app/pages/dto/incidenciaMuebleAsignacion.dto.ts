import { IDicPoc, IDicUsuario } from "./dictionary.dto";

export interface IIncidenciaMuebleAsignacion {
    marca: string;
    tipo_mueble: string;
    latitud: Number;
    longitud: Number;
    empresa_id: string;
    poc: IDicPoc;
    usuario: IDicUsuario;
    fecha_creacion: Date;
    id: string;
    offline?: number;
  }
  export interface IIncidenciaMuebleAsignacionResponse {
    docs: IIncidenciaMuebleAsignacion[];
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