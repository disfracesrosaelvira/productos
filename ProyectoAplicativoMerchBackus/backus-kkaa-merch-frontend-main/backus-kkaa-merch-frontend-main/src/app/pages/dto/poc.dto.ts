export interface IPoc {
  poc: number;
  nombre: string;
  poc_cadena: string;
  poc_backus: string;
  nombre_planning: string;
  tipo: string;
  documento_sv: string;
  nombre_sv: string;
  estado: number;
  usuario_id_creacion: string;
  usuario_id_actualizacion: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  _id: string;
  poc_livetrade: string;
  cadena?: string;
  gerencia?: string;
  region?: string;
}

export interface IPocResponse {
    docs: IPoc[];
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