import { IDicImagen, IDicPoc, IDicUsuario } from "./dictionary.dto";

  export interface IIncidenciaMuebleRecojo {
    marca: string;
    tipo_mueble: string;
    motivo_recojo: string;
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
  export interface IIncidenciaMuebleRecojoResponse {
    docs: IIncidenciaMuebleRecojo[];
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