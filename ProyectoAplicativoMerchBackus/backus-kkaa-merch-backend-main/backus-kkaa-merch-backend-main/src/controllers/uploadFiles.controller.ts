// import { promises as fs } from 'fs';
import { Request, Response } from "express";
import { UploadFilesService } from "../services/uploadFiles.service";
import multer from "multer";
import sharp from 'sharp';
import fs from 'fs';
const ExcelJS = require("exceljs");
// import  getStackTrace  from '../utils/logger';
import { handleHttpError } from "../utils/handleError";
import { AzureStorageService } from "../services/azureStorage.service";
import { extname, join } from "path";
import { formatISO } from "date-fns";
import { ADLS_SAS_TOKEN_USER } from "../config";

export default class UploadFilesController {
  encuestasService = new UploadFilesService();
  public azureStorageService = new AzureStorageService();
  storage = multer.memoryStorage();
  upload = multer({ storage: this.storage });

  constructor() {}

  upEncuestas = async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).send("No se ha recibido ningún archivo.");
      }

      // Leer el archivo Excel desde el buffer en memoria
      const workbook = new ExcelJS.Workbook();
      const data = await this.readData(workbook, req.file.buffer, res);
      const save = await this.encuestasService.saveEncuestaExcel(data);
      res.status(200).json({
        message: "Archivo Excel recibido y procesado correctamente.",
        data: save,
      });
    } catch (error) {
      handleHttpError(
        res,
        error instanceof Error
          ? error.message
          : "Se produjo un error desconocido"
      );
    }
  };

  photoPriceUpload = async (req: any, res: Response) => {
    try {
      const nameTable = req.body.table as string | undefined;
      const uuid = req.body.uuid as string | undefined;
      const user_id = req.body.user as string | undefined;
      let data = req.body.data as string | undefined;
      if (!req.file) {
        return res.status(400).send("No se ha recibido ningún archivo.");
      }
      if (!nameTable || !uuid || !data) {
        return res.status(400).send("No se ha recibido informacion requerida.");
      }
      const image = req.file;
      const image_utf8 = Buffer.from(image.originalname, "latin1")
        .toString("utf8")
        .normalize();
      // const bufferPhoto = image.buffer;
      const nameFile = `photo-${nameTable}-${uuid}${extname(image_utf8)}`;
      
      let fileUrl: any = "";
      // Como historico se guardan las imagenes en el storage de azure
      try {
        fileUrl = await this.azureStorageService.uploadFile(
          "input-photo",
          image,
          nameFile
        );
      } catch (error) {
        // const line = getStackTrace();
        console.error("Error input storage: ", error, "at");
      }
      console.log("Photo uploaded to Azure");
      const formatExcelUrl = `${fileUrl.split("?")[0]}`;
      let parsedData = JSON.parse(data);
      if (parsedData && typeof parsedData === 'object') {
        const nowUTC = new Date();
        // parsedData.imgUrl = fileUrl;
        parsedData.imgUrl = formatExcelUrl;
        parsedData.created_at = new Date();
      }

      //guardar en la base de datos la data-comentario
      const save = await this.encuestasService.saveDataUploadPhoto(nameTable, parsedData);

      res.status(200).json({
        success: true,
        message: "photo uploaded successfully."
      });
    } catch (error) {
      handleHttpError(
        res,
        error instanceof Error
          ? error.message
          : "Se produjo un error desconocido"
      );
    }
  };

  // photoUpload = async (req: any, res: Response) => {
  //   try {
  //     const nameTable = req.body.table as string | undefined;
  //     const uuid = req.body.uuid as string | undefined;
  //     const nameContainer = req.body.nameContainer as string | undefined;
  //     let data = req.body.data as string | undefined;
  //     if (!req.file) {
  //       return res.status(400).send("No se ha recibido ningún archivo.");
  //     }
  //     if (!nameTable || !uuid || !data || !nameContainer) {
  //       return res.status(400).send("No se ha recibido informacion requerida.");
  //     }
  //     const image = req.file;
  //     const image_utf8 = Buffer.from(image.originalname, "latin1")
  //       .toString("utf8")
  //       .normalize();
  //     const nameFile = `photo-${nameTable}-${uuid}${extname(image_utf8)}`;
      
  //     let fileUrl: any = "";
  //     try {
  //       fileUrl = await this.azureStorageService.uploadFile(
  //         `${nameContainer}` ,
  //         image,
  //         nameFile
  //       );
  //     } catch (error) {
  //       console.error("Error input storage: ", error, "at");
  //     }
  //     const imgUrl = `${fileUrl.split("?")[0]}`;
  //     let parsedData = JSON.parse(data);
  //     if (parsedData && typeof parsedData === 'object') {
  //       parsedData.nameFile = nameFile;
  //       parsedData.imgUrl = imgUrl;
  //       parsedData.viewImg = fileUrl;
  //       parsedData.created_at = new Date();
  //     }

  //     res.status(200).json({
  //       success: true,
  //       message: "photo uploaded successfully.",
  //       data   : parsedData
  //     });
  //   } catch (error) {
  //     handleHttpError( res, error instanceof Error ? error.message : "Se produjo un error desconocido"  );
  //   }
  // };

  photoUpload = async (req: any, res: Response) => {
    try {
      const nameTable = req.body.table as string | undefined;
      const uuid = req.body.uuid as string | undefined;
      const nameContainer = req.body.nameContainer as string | undefined;
      let data = req.body.data as string | undefined;
      
      if (!req.file) {
        return res.status(400).send("No se ha recibido ningún archivo.");
      }
      if (!nameTable || !uuid || !data || !nameContainer) {
        return res.status(400).send("No se ha recibido información requerida.");
      }
      
      const image = req.file;
      console.log("type:"+image.mimetype);
      
      const image_utf8 = Buffer.from(image.originalname, "latin1")
        .toString("utf8")
        .normalize();
      const nameFile = `photo-${nameTable}-${uuid}${extname(image_utf8)}`;
      // const nameFile = `photo-${nameTable}-${uuid}.webp`;
      
      // Optimización de la imagen con Sharp
      // const optimizedImageBuffer = await sharp(image.buffer)
      //   .resize(800) // Ajusta el tamaño de la imagen
      //   .toFormat('jpeg', { quality: 80 }) // Ajusta el formato y la calidad
      //   .toBuffer();
      const optimizedImageBuffer = await sharp(image.buffer)
        .rotate() // Corrige la orientación según los datos EXIF
        .resize(800) // Ajusta el tamaño de la imagen
        .toFormat('webp', { quality: 80 })
        // .toFormat('jpeg', { quality: 80 }) // Ajusta el formato y la calidad
        .toBuffer();
  
      let fileUrl: any = "";
      try {
        fileUrl = await this.azureStorageService.uploadFile(
          nameContainer,
          {
            buffer: optimizedImageBuffer,
            size: optimizedImageBuffer.length
          },
          nameFile
        );
      } catch (error) {
        console.error("Error input storage: ", error, "at");
        return res.status(500).send("Error al subir la imagen optimizada.");
      }
  
      const imgUrl = `${fileUrl.split("?")[0]}`;
      let parsedData = JSON.parse(data);
      if (parsedData && typeof parsedData === 'object') {
        const nowUTC = new Date();
        parsedData.nameFile = nameFile;
        parsedData.imgUrl = imgUrl;
        parsedData.viewImg = imgUrl + '?' + ADLS_SAS_TOKEN_USER;
        parsedData.created_at = new Date();
      }
  
      res.status(200).json({
        success: true,
        message: "Photo uploaded successfully.",
        data: parsedData
      });
    } catch (error) {
      handleHttpError(res, error instanceof Error ? error.message : "Se produjo un error desconocido");
    }
  };

  photoDelete = async (req: Request, res: Response) => {
    try {
      const nameFile = req.query.nameFile as string | undefined;
      const containerName = req.query.containerName as string | undefined;
      if (!nameFile || !containerName) {
        return res.status(400).send("No se ha recibido informacion requerida para Adicionales.");
      }
      // remove file azure
      await this.azureStorageService.deleteFile(containerName, nameFile);
      res.status(200).json({
        success: true,
        message: "save successfully."
      });
    } catch (error) {
      handleHttpError(
        res,
        error instanceof Error
          ? error.message
          : "Se produjo un error desconocido"
      );
    }
  };

  async readData(workbook: any, dataExcelBuffer: any, res: any) {
    try {
      await workbook.xlsx.load(dataExcelBuffer);

      // Procesar el archivo Excel
      const worksheet = workbook.getWorksheet(1);

      // Recorrer las filas y procesar los datos como sea necesario
      const data: any[] = [];
      worksheet.eachRow((row: any, rowIndex: any) => {
        // Obtener los valores de cada celda en la fila
        const rowData = row.values;
        // Agregar los datos de la fila al array
        data.push(rowData);
      });

      return data;
    } catch (error: any) {
      console.error("Error al leer el archivo Excel:", error);
      throw new Error("Error al procesar el archivo Excel.");
    }
  }
}
