import { IDicImagen, IDicPoc, IDicUsuario } from "./dictionary.dto";

  export interface IIncidenciaCompetencia {
    tipo: string;
    marca: string;
    comentario: string;
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
  
  export interface IIncidenciaCompetenciaResponse {
    docs: IIncidenciaCompetencia[];
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