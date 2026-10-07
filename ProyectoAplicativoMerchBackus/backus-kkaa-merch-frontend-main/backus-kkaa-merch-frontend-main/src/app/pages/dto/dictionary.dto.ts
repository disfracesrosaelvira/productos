export interface IDicImagen {
    nombre: string;
    imagen_url: string;
    fecha_creacion: string;
}


export interface IDicSku {
  marca: string;
  cantidad: number;
  linea: string;
}

export interface IDicSkuStock {
  sku: number;
  descripcion: string;
  gondola_stock: number;
  exhibicion_stock: number;
}

export interface IDicSkuPrice {
  sku: number;
  descripcion: string;
  marca: string;
  pvp_regular: number;
  selected_mecanica: string;
  pvp_promocional: number;
  pvp_adicional: number;
  imagen_url: string;
}

export interface IDicPoc {
  poc: number;
  nombre: string;
  poc_cadena: string;
  poc_backus: string;
  nombre_planning: string;
  tipo: string;
  documento_sv: string;
  nombre_sv: string;
  poc_livetrade: string;
  cadena: string
}

export interface IDicUsuario {
  usuario_id: string;
  nombre: string;
  rol: string;
}

export interface IPocStorage {
  poc: number;
  nombre: string;
  poc_cadena: string;
  poc_backus: string;
  nombre_planning: string;
  tipo: string;
  documento_sv: number;
  nombre_sv: string;
  cadena: string;
  gerencia: string;
  region: string;
}

export interface IUserStorage {
  usuario_id: number;
  nombre: string;
  rol: string;
}

export interface ILocationStorage {
  latitude: number;
  longitude: number;
}

export interface IInformationTable {
  table: string;
  nameContainer: string;
  nameBDIndex: string;
  nameCollectionPhotos: string;
  nameCollectionEncuestas: string;
}