import { IDicPoc, IDicUsuario } from "./dictionary.dto";

export interface IExhibicionContraprestada {
    empresa_id: string;
    // poc: number;
    // poc_nombre: string;
    zona: string;
    tipo_exhibicion: string;
    correlativo: string;
    tienda: string;
    campaña: string;
    fecha_inicio: string;
    fecha_fin: string;
    marca: string;
    skus: string;
    vigente: boolean;
    // usuario_id:string,
    // usuario_nombre:string,
    fecha_creacion:string,
    validaciones:any;
    // documento_sv:string;
    // nombre_sv: string;
    poc: IDicPoc;
    usuario: IDicUsuario;
    id: string;
    offline?: number;
    vigencia_fecha_inicio?: string;
    vigencia_fecha_fin?: string;
    fecha_ultimo_relevo?: string;
    tipo_mueble?: number;
  }

  export interface IExhibicionContraprestadaResponse {
    docs: IExhibicionContraprestada[];
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