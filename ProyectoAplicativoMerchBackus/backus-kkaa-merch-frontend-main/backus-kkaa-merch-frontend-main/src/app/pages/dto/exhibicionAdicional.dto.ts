import { IDicPoc, IDicUsuario } from "./dictionary.dto";

export interface IImagen {
    nombre: string;
    imagen_url: string;
}
export interface IValidacion {
  comentario: string;
  fecha_creacion: any;
  fecha_fin_vigencia: any;
  fecha_inicio_vigencia: any;
  usuario: any;
  imagenes: IImagen[];
}
export interface IExhibicionAdicional {
    zona: string;
    tipo_exhibicion: string;
    fecha_inicio_vigencia: Date;
    fecha_fin_vigencia: Date;
    skus: any;
    validaciones: IValidacion[];
    latitud: string;
    longitud: string;
    cantidad: number;
    poc: IDicPoc;
    usuario: IDicUsuario;
    // poc_nombre: string;
    empresa_id: string;
    // usuario_id: string;
    // usuario_nombre:string,
    id: string;
    fecha_creacion: Date;
    fecha_eliminacion: Date;
    fecha_ultimo_relevo?: string;
    offline?: number;
    tipo_mueble?: number;
    // documento_sv:string,
    // nombre_sv: string
  }
  
  export interface IExhibicionAdicionalResponse {
    docs: IExhibicionAdicional[];
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