export interface IEstructuraComercial {
    _id: string;
    poc: number;
    poc_nombre: string;
    poc_cadena: string;
    poc_backus: string;
    poc_nombre_planning: string;
    poc_tipo: string;
    documento_sv: string;
    nombre_sv: string;
    documento_bdr: string;
    nombre_bdr: string;
    estado: number;
    usuario_id_creacion: string;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
    usuario_id_actualizacion: string;
  }
  export interface IEstructuraComercialResponse {
    docs: IEstructuraComercial[];
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