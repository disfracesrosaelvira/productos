import xlsx from "xlsx";
import path from "path";
import { format, isValid, parse } from "date-fns";
import fs from "fs";
import Constantes from "../utils/constant";
import Model from "../db/index";
import { v4 as uuidv4 } from "uuid";

export class ConvertDataService {
  pocModel = Model.collection("poc");
  private fileParsers = {
    ".xlsx": this.parseExcel,
  };

  constructor() {}

  parseExcelToJson(
    fileBuffer: Buffer,
    fileName: string,
    entity,
    typeEntity
  ): any[] {
    try {
      // obtenemos la extensión del archivo
      const fileExtension = path.extname(fileName);
      const parser = this.fileParsers[fileExtension];
      if (!parser) {
        throw new Error("El archivo no es compatible con el formato esperado");
      }
      // parseamos el archivo por el tipo de extensión
      const data =
        fileExtension === ".csv"
          ? parser(fileBuffer, entity, typeEntity)
          : parser(fileBuffer, entity, typeEntity);
      // retornamos un mensaje de éxito
      return data;
    } catch (error) {
      console.error("Error en el proceso:", error);
      throw error;
    }
  }

  // Parsea un archivo de Excel y retorna los datos en formato JSON
  async parseExcel(
    buffer: Buffer,
    entity,
    typeEntity,
    usuario,
    configValue
  ): Promise<any[]> {
    const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: null,
    });
    // Define las columnas que quieres mantener
    const columnsToKeep = Constantes.EXCEL_VALID_HEADERS[entity][typeEntity];
    // const nameColumn = Constantes.NAME_COLUMNS_FECHA_FOR_ENTITY[entity][typeEntity];
    // const desiredDateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";
    const job_id = uuidv4();
    const marca_marca_y_linea_homologadas = configValue.result.find((item: any) => item.codigo === 'marca_marca_y_linea_homologadas').valor;
    const skus_linea_homologadas = configValue.result.find((item: any) => item.codigo === 'skus_linea_homologadas').valor;

    const filteredData = jsonData.map((row: any) => {
      let filteredRow = {};
      for (let key in row) {
        let trimmedKey = key.trim(); // remove leading and trailing whitespace
        if (columnsToKeep.includes(trimmedKey)) {
          if (row[key] === undefined || row[key] === "#N/A") {
            filteredRow[key] = null;
          } else {
            filteredRow[key] = row[key];
          }
        }
      }
      // Verifica y formatea fecha_inicio
      // if (filteredRow["fecha_inicio"]) {
      //   let parsedDate = parse(
      //     filteredRow["fecha_inicio"],
      //     "yyyy-MM-dd",
      //     new Date()
      //   );
      //   if (isValid(parsedDate)) {
      //     filteredRow["fecha_inicio"] = new Date(
      //       format(new Date(parsedDate), "yyyy-MM-dd") + "T00:00:00Z"
      //     );
      //   } else {
      //     throw {
      //       validacion: [
      //         { observacion: `Fecha inválida en la columna fecha_inicio` },
      //       ],
      //     };
      //   }
      // }

      // Verifica y formatea fecha_fin
      // if (filteredRow["fecha_fin"]) {
      //   let parsedDate = parse(
      //     filteredRow["fecha_fin"],
      //     "yyyy-MM-dd",
      //     new Date()
      //   );
      //   if (isValid(parsedDate)) {
      //     filteredRow["fecha_fin"] = new Date(
      //       format(new Date(parsedDate), "yyyy-MM-dd") + "T00:00:00Z"
      //     );
      //   } else {
      //     throw {
      //       validacion: [
      //         { observacion: `Fecha inválida en la columna fecha_fin` },
      //       ],
      //     };
      //   }
      // }
      // if(entity == 'exhibicion' && typeEntity == 'contraprestada'){
      let fechaInicio = new Date(filteredRow['fecha_inicio']);
      filteredRow['fecha_inicio'] = new Date(fechaInicio.setUTCHours(0, 0, 0, 0));

      // Para fecha_fin
      let fechaFin = new Date(filteredRow['fecha_fin']);
      filteredRow['fecha_fin'] = new Date(fechaFin.setUTCHours(0, 0, 0, 0));

      if (filteredRow['vigencia_fecha_inicio'] && filteredRow['vigencia_fecha_fin']) { // verifica si viene desde el frontend
        let vigenciaFechaInicio = new Date(filteredRow['vigencia_fecha_inicio']);
        filteredRow['vigencia_fecha_inicio'] = new Date(vigenciaFechaInicio.setUTCHours(0, 0, 0, 0));
        let vigenciaFechaFin = new Date(filteredRow['vigencia_fecha_fin']);
        filteredRow['vigencia_fecha_fin'] = new Date(vigenciaFechaFin.setUTCHours(0, 0, 0, 0));
      }
      if ('number' === typeof filteredRow['correlativo']) {
        filteredRow['correlativo'] = filteredRow['correlativo'].toString();
      }

      filteredRow["vigente"] = false;
      filteredRow["fecha_creacion"] = new Date(new Date().toUTCString());
      filteredRow["usuario"] = usuario;
      filteredRow["exhibicion_contraprestada_id"] = uuidv4();
      filteredRow["job_id"] = job_id;
      filteredRow["offline"] = 0;
      filteredRow['fecha_de_carga'] = new Date((new Date(filteredRow['fecha_de_carga'])).setUTCHours(0, 0, 0, 0));

      const marca = marca_marca_y_linea_homologadas.find((item: any) => item.label === filteredRow['marca']);
      if (marca) {
        filteredRow['marca_homologada'] = marca.value.marca_homologada;
        filteredRow['linea_homologada'] = marca.value.linea_homologada;
      } else {
        filteredRow['marca_homologada'] = "por_homologar_marca";
        filteredRow['linea_homologada'] = "por_homologar_linea";
      }
      const sku = skus_linea_homologadas.find((item: any) => item.label === filteredRow['skus']);
      if (sku) {
        filteredRow['sku_homologado'] = sku.value.sku_homologado;
      } else {
        filteredRow['sku_homologado'] = "por_homologar_sku";
      }
      
      return filteredRow;
    });

    return filteredData;
  }
}
