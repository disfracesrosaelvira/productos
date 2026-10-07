import Model from "../db/index";
import { addDays, format } from "date-fns";

export class UploadFilesService {
  encuestas = Model.collection("encuestas");
  stock = Model.collection("encuestas");
  categorias = Model.collection("sku");
  productos = Model.collection("sku");
  frente = Model.collection("frente");
  precioInput = Model.collection("precio");
  incidenciaCompetenciaInput = Model.collection("incidencia_compentencia_input");
  incidenciaMueblesInput = Model.collection("incidencia_muebles_input");
  exhibicionInput = Model.collection("exhibicion_input");
  exhibicionAdicional = Model.collection('exhibicion_adicional');
  exhibicionCompetencia = Model.collection('exhibicion_competencia');
  exhibicioneContraprestada = Model.collection('exhibicion_contraprestada');

  constructor() { }

  public async saveEncuestaExcel(excelData: any[][]) {
    try {
      let encuestas: any[] = [];
      excelData.forEach(async (fila: any, item: any) => {
        if (fila && fila.length > 0 && item > 0) {
          let data = fila;
          let date = new Date(data[6]);
          if (data) {
            switch (data[5]) {
              case "precio":
                encuestas.push({
                  app: data[1],
                  sucursal: data[2],
                  categoria: data[3],
                  producto: data[4],
                  tipo: data[5],
                  pvpRegular: 0,
                  mecanicaProvicional: "",
                  fotoPrecios: "",
                  fechaInicio: format(
                    date.setHours(0, 0, 0, 0),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  fechaFin: format(
                    addDays(date.setHours(23, 59, 59), 7),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                });
                break;
              case "osa":
                encuestas.push({
                  app: data[1],
                  sucursal: data[2],
                  categoria: data[3],
                  producto: data[4],
                  tipo: data[5],
                  disponibilidad: "",
                  fechaInicio: format(
                    date.setHours(0, 0, 0, 0),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  fechaFin: format(
                    addDays(date.setHours(23, 59, 59), 7),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                });
                break;
              case "exhibiciones":
                encuestas.push({
                  app: data[1],
                  sucursal: data[2],
                  tipo: data[5],
                  fechaInicio: format(
                    date.setHours(0, 0, 0, 0),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  fechaFin: format(
                    addDays(date.setHours(23, 59, 59), 7),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  listaExhibiciones: [],
                });
                break;
              case "frentes":
                encuestas.push({
                  app: data[1],
                  sucursal: data[2],
                  tipo: data[5],
                  fechaInicio: format(
                    date.setHours(0, 0, 0, 0),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  fechaFin: format(
                    addDays(date.setHours(23, 59, 59), 7),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  foto: "",
                  frentesTotales: 0,
                  frentesTotalesPorMarca: 0,
                  panogramaImplementado: false,
                  medidasGondolas: {
                    alto: 0,
                    largo: 0,
                    profundidad: 0,
                    bande: 0,
                  },
                });
                break;
              case "incidencias":
                encuestas.push({
                  app: data[1],
                  sucursal: data[2],
                  tipo: data[5],
                  fechaInicio: format(
                    date.setHours(0, 0, 0, 0),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  fechaFin: format(
                    addDays(date.setHours(23, 59, 59), 7),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  competencia: {
                    activaciones: false,
                    foto: "",
                    impulso: false,
                    muestreoDegustacion: false,
                    packs: false,
                    sampling: false,
                    ventaCruzada: false,
                    materialesVisibilidad: false,
                  },
                  relacionamiento: {
                    gerenteTienda: "",
                    jefeSeccion: "",
                    jefeTienda: "",
                    personalSeguridad: "",
                  },
                  muebles: {
                    asignacion: [],
                    matenimiento: [],
                    recojo: [],
                  },
                });
                break;
              case "stock":
                const stockProductos = data[4].split(",");
                const detailStockProducto: {
                  nombreProducto: any;
                  almacen: number;
                  exhibiciones: number;
                  gondola: number;
                }[] = [];

                await stockProductos.forEach((value: any) => {
                  detailStockProducto.push({
                    nombreProducto: value,
                    almacen: 0,
                    exhibiciones: 0,
                    gondola: 0,
                  });
                });

                encuestas.push({
                  app: data[1],
                  sucursal: data[2],
                  tipo: data[5],
                  fechaInicio: format(
                    date.setHours(0, 0, 0, 0),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  fechaFin: format(
                    addDays(date.setHours(23, 59, 59), 7),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  productos: detailStockProducto,
                });
                break;
              case "ventas":
                const ventasProductos = data[4].split(",");
                const detailVentaProducto: {
                  nombreProducto: any;
                  lunes: number;
                  martes: number;
                  miercoles: number;
                  jueves: number;
                  viernes: number;
                  sabado: number;
                  domingo: number;
                }[] = [];

                await ventasProductos.forEach((value: any) => {
                  detailVentaProducto.push({
                    nombreProducto: value,
                    lunes: 0,
                    martes: 0,
                    miercoles: 0,
                    jueves: 0,
                    viernes: 0,
                    sabado: 0,
                    domingo: 0,
                  });
                });

                encuestas.push({
                  app: data[1],
                  sucursal: data[2],
                  tipo: data[5],
                  fechaInicio: format(
                    date.setHours(0, 0, 0, 0),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  fechaFin: format(
                    addDays(date.setHours(23, 59, 59), 7),
                    "yyyy-MM-dd'T'HH:mm:ss"
                  ),
                  productos: detailVentaProducto,
                });
                break;
              default:
                break;
            }
          }
        }
      });

      const result = await this.encuestas.insertMany(encuestas);

      // Enviar la respuesta al cliente
      return { id: result };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al procesar el archivo Excel:", error);
      throw new Error("Error al procesar el archivo Excel.");
    }
  }

  public async saveDataUploadPhoto(nameTable: string, dataTable: any) {
    let result: any = [];
    try {
      switch (nameTable) {
        case "precio_input":
          result = await this.precioInput.insertOne(dataTable);
          break;
        case "frente":
          result = await this.frente.insertOne(dataTable);
          break;
        case "incidencia_compentencia_input":
          result = await this.incidenciaCompetenciaInput.insertOne(dataTable);
          break;
        case "exhibicion_input":
          result = await this.exhibicionInput.insertOne(dataTable);
          break;
        case "exhibicion_adicional":
          result = await this.exhibicionAdicional.insertOne(dataTable);
          break;
        case "exhibicion_competencia":
          result = await this.exhibicionCompetencia.insertOne(dataTable);
          break;
        case "exhibicion_contraprestada":
          result = await this.exhibicioneContraprestada.insertOne(dataTable);
          break;
        default:
          break;
      }

      // Enviar la respuesta al cliente
      return { id: result };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al procesar la data:", error);
      throw new Error("Error al procesar la data.");
    }
  }
}
