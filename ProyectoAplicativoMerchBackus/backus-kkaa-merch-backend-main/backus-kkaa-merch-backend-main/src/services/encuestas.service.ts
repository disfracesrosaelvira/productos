import Model from "../db/index";
import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { addDays, format } from "date-fns";
const { v4: uuidv4 } = require('uuid');

export class EncuestasService {
  encuestas = Model.collection("encuestas");
  currentDate = format(
    new Date().setHours(0, 0, 0, 0),
    "yyyy-MM-dd'T'HH:mm:ss"
  );

  constructor() {}
  public async getEncuestasPrecio(req: Request) {
    try {
      const { app, sucursal, categoria } = req.params;
      const result = await this.encuestas
        .find({
          app,
          sucursal,
          categoria,
          tipo: "precio",
          fechaInicio: { $lte: this.currentDate },
          fechaFin: { $gte: this.currentDate },
        })
        .toArray();

      // Enviar la respuesta al cliente
      return { listEncuestaPrecios: result };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async saveEncuestaPrecio(req: Request) {
    try {
      const { app, sucursal, categoria } = req.params;
      const { pvpRegular, mecanicaProvicional, fotoPrecios } = req.body;

      const encuestaPrecio = {
        app,
        sucursal,
        categoria,
        tipo: "precio",
        pvpRegular,
        mecanicaProvicional,
        fotoPrecios,
      };

      const result = await this.encuestas.insertOne(encuestaPrecio);

      // Obtener el ID del documento recién insertado
      const insertedId = result.insertedId;

      // Enviar la respuesta al cliente
      return { id: insertedId };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async updateEncuestaPrecios(req: Request) {
    try {
      const { id } = req.params;
      const { pvpRegular, mecanicaProvicional, fotoPrecios } = req.body;

      const result = await this.encuestas.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            pvpRegular,
            mecanicaProvicional,
            fotoPrecios,
          },
        }
      );

      // Obtener el ID del documento recién insertado
      const insertedId = result;

      // Enviar la respuesta al cliente
      return { id: insertedId };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }

  public async getEncuestasFrentes(req: Request) {
    try {
      const { app, sucursal, categoria } = req.params;
      const result = await this.encuestas
        .find({
          app,
          sucursal,
          categoria,
          tipo: "frentes",
          fechaInicio: { $lte: this.currentDate },
          fechaFin: { $gte: this.currentDate },
        })
        .toArray();

      // Enviar la respuesta al cliente
      return { listEncuestaFrentes: result };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async saveEncuestaFrentes(req: Request) {
    try {
      const { app, sucursal, categoria } = req.params;
      const {
        frentesTotales,
        frentesTotalesPorMarca,
        foto,
        panogramaImplementado,
        medidasGondolas,
      } = req.body;

      const encuestaFrentes = {
        app,
        sucursal,
        categoria,
        tipo: "frentes",
        frentesTotales,
        frentesTotalesPorMarca,
        foto,
        panogramaImplementado,
        medidasGondolas,
      };

      const result = await this.encuestas.insertOne(encuestaFrentes);

      // Obtener el ID del documento recién insertado
      const insertedId = result.insertedId;

      // Enviar la respuesta al cliente
      return { id: insertedId };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async updateEncuestaFrentes(req: Request) {
    try {
      const { id } = req.params;
      const {
        frentesTotales,
        frentesTotalesPorMarca,
        foto,
        panogramaImplementado,
        medidasGondolas,
      } = req.body;

      const result = await this.encuestas.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            frentesTotales,
            frentesTotalesPorMarca,
            foto,
            panogramaImplementado,
            medidasGondolas,
          },
        }
      );

      // Obtener el ID del documento recién insertado
      const insertedId = result;

      // Enviar la respuesta al cliente
      return { id: insertedId };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async getEncuestasExhibiciones(req: Request) {
    try {
      const { app, sucursal } = req.params;
      const result = await this.encuestas
        .find({
          app,
          sucursal,
          tipo: "exhibiciones",
          fechaInicio: { $lte: this.currentDate },
          fechaFin: { $gte: this.currentDate },
        })
        .toArray();

      // Enviar la respuesta al cliente
      return { listEncuestaExcibiciones: result };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async updateEncuestasExhibiciones(req: Request) {
    try {
      const { id } = req.params;
      const {
        idExhibicion,
        zona,
        tipoExibicion,
        fechaInicio,
        fechaFin,
        productos,
        contraprestada,
        foto,
      } = req.body;

      if (idExhibicion === "") {
        const encuesta = await this.encuestas.findOne({_id: new ObjectId(id)})
        const exhibicion = {
          id:uuidv4(),
          zona,
          tipoExibicion,
          fechaInicio,
          fechaFin,
          productos,
          contraprestada,
          foto,
        };
        
        encuesta?.listaExhibiciones.push(exhibicion)
        const result = await this.encuestas.updateOne({ _id: new ObjectId(id) }, { $set: { listaExhibiciones: encuesta?.listaExhibiciones } });
  
        // Enviar la respuesta al cliente
        return { id: result };

      } else {
        const result = await this.encuestas.updateOne(
          { _id: new ObjectId(id), "listaExhibiciones.id": idExhibicion },
          {
            $set: {
              "listaExhibiciones.$.zona": zona,
              "listaExhibiciones.$.tipoExibicion": tipoExibicion,
              "listaExhibiciones.$.fechaInicio": fechaInicio,
              "listaExhibiciones.$.fechaFin": fechaFin,
              "listaExhibiciones.$.productos": productos,
              "listaExhibiciones.$.contraprestada": contraprestada,
              "listaExhibiciones.$.foto": foto,
            },
          }
        );
        // Obtener el ID del documento recién insertado
        const insertedId = result;

        // Enviar la respuesta al cliente
        return { id: insertedId };
      }
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async getEncuestasIncidencias(req: Request) {
    try {
      const { app, sucursal } = req.params;
      const listEncuestasIncidencias = await this.encuestas
        .find({ app, sucursal, tipo: "incidencias" })
        .toArray();

      // Enviar la respuesta al cliente
      return { listEncuestasIncidencias: listEncuestasIncidencias };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async updateEncuestasIncidencias(req: Request) {
    try {
      const { id } = req.params;
      const { competencia, relacionamiento, muebles } = req.body;

      const result = await this.encuestas.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            competencia,
            relacionamiento,
            muebles,
          },
        }
      );

      // Obtener el ID del documento recién insertado
      const insertedId = result;

      // Enviar la respuesta al cliente
      return { id: insertedId };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async getEncuestasStock(req: Request) {
    try {
      const { app, sucursal } = req.params;
      const listEncuestasStock = await this.encuestas
        .find({
          app,
          sucursal,
          tipo: "stock",
          fechaInicio: { $lte: this.currentDate },
          fechaFin: { $gte: this.currentDate },
        })
        .toArray();

      // Enviar la respuesta al cliente
      return { listEncuestasStock: listEncuestasStock };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
  public async updateEncuestasStock(req: Request) {
    try {
      const { id } = req.params;
      const { productos } = req.body;

      const result = await this.encuestas.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            productos,
          },
        }
      );

      // Obtener el ID del documento recién insertado
      const insertedId = result;

      // Enviar la respuesta al cliente
      return { id: insertedId };
    } catch (error) {
      // Manejar cualquier error
      console.error("Error al obtener las productos:", error);
      return { error: "Error interno del servidor" };
    }
  }
}