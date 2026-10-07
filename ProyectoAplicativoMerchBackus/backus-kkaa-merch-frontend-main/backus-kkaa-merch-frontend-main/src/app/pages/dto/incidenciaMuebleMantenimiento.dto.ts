import { IDicImagen, IDicPoc, IDicUsuario } from "./dictionary.dto";

  export interface IIncidenciaMuebleMantenimiento {
    marca: string;
    tipo_mueble: string;
    tipo_mantenimiento: string;
    imagenes: IDicImagen[];
    latitud: Number;
    longitud: Number;
    empresa_id: string;
    poc: IDicPoc;
    usuario: IDicUsuario;
    fecha_creacion: Date;
    id: string;
    offline?: number;
  }
  export interface IIncidenciaMuebleMantenimientoResponse {
    docs: IIncidenciaMuebleMantenimiento[];
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