import { IDicPoc, IDicUsuario } from "./dictionary.dto";

export interface IImagen {
  nombre: string;
  imagen_url: string;
}
interface IValidacion {
  comentario: string;
  fecha_creacion: any;
  fecha_fin_vigencia: any;
  fecha_inicio_vigencia: any;
  usuario: any;
  imagenes: IImagen[];
}
export interface IExhibicionCompetencia {
    zona: string;
    tipo_exhibicion: string;
    skus: any;
    contraprestada: boolean;
    validaciones: IValidacion [];
    latitud: string;
    longitud: string;
    fecha_inicio_vigencia: string;
    fecha_fin_vigencia: string;
    poc: IDicPoc;
    usuario: IDicUsuario;
    // poc_nombre: string;
    empresa_id: string;
    // usuario_id: string;
    // usuario_nombre:string,
    id: string;
    fecha_creacion: string;
    fecha_eliminacion: Date;
    fecha_ultimo_relevo?: string;
    offline?: number;
    // documento_sv:string;
    // nombre_sv: string;
  }

  export interface IExhibicionCompetenciaResponse {
    docs: IExhibicionCompetencia[];
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