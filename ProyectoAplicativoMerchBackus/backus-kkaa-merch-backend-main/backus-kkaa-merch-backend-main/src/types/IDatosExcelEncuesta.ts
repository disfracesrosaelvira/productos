
export interface IDatosExcelEncuesta {
    app: string;
    sucursal: string;
    categoria: string;
    producto: string;
    tipoEncuesta: string;
    pvpRegular?: number;
    mecanicaProvicional?: string;
    fotoPrecios?: string;
    disponibilidad?: string;
    fechaInicio: Date;
    FechaFin?: Date;
}
