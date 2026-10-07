import { Injectable } from '@angular/core';
import * as localforage from 'localforage';
import { environment } from 'src/app/environments/environment';
// import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class StoreOfflineService {

  private stores: { [key: string]: any } = {};
  private secretKey = environment.secret_key; // Debes usar una clave más segura en producción

  constructor() {
    this.initStores();
  }

  private initStores() {
    this.stores[`${environment.tb_index_exhibicion_adicional}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_exhibicion_adicional}`
    });

    this.stores[ `${environment.tb_index_exhibicion_competencia}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_exhibicion_competencia}`
    });

    this.stores[ `${environment.tb_index_exhibicion_contraprestada}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_exhibicion_contraprestada}`
    });

    this.stores[ `${environment.tb_index_exhibicion_adicional_renovable}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_exhibicion_adicional_renovable}`
    });

    this.stores[ `${environment.tb_index_exhibicion_competencia_renovable}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_exhibicion_competencia_renovable}`
    });

    this.stores[ `${environment.tb_index_poc}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_poc}`
    });

    this.stores[ `${environment.tb_index_users}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_users}`
    });

    this.stores[ `${environment.tb_index_sku}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_sku}`
    });

    this.stores[ `${environment.tb_index_config_value}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_config_value}`
    });

    this.stores[ `${environment.tb_index_frente}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_frente}`
    });

    this.stores[ `${environment.tb_index_stock}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_stock}`
    });

    this.stores[ `${environment.tb_index_precio}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_precio}`
    });

    this.stores[ `${environment.tb_index_incidencia_competencia}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_incidencia_competencia}`
    });

    this.stores[ `${environment.tb_index_incidencia_mueble_asignacion}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_incidencia_mueble_asignacion}`
    });

    this.stores[ `${environment.tb_index_incidencia_mueble_mantenimiento}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_incidencia_mueble_mantenimiento}`
    });

    this.stores[ `${environment.tb_index_incidencia_mueble_recojo}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_incidencia_mueble_recojo}`
    });

    this.stores[ `${environment.tb_index_imagen}`] = localforage.createInstance({
      name: `${environment.bd_index_merch}`,
      storeName: `${environment.tb_index_imagen}`
    });

  }

  // Obtener una instancia del almacén
  private getStore(storeName: string) {
    return this.stores[storeName];
  }

  // Función para agregar un documento a un almacén
  addDocument(storeName: string, doc: any, collection: string = `collection`): Promise<void> {
    let store = this.getStore(storeName);
    if (!store) {
      store = this.createStore(storeName); // Asume que createStore hace lo necesario y retorna una referencia al nuevo almacén
    }

    return store.getItem(`${collection}`).then((data: any[] | null) => {
      if (data) {
        data.push(doc);
        return store.setItem(`${collection}`, data);
      } else {
        return store.setItem(`${collection}`, [doc]);
      }
    });
    // return this.getStore(storeName).getItem(`${collection}`).then((data: any[] | null) => {
    //   if (data) {
    //     data.push(doc);
    //     return this.getStore(storeName).setItem(`${collection}`, data);
    //   } else {
    //     return this.getStore(storeName).setItem(`${collection}`, [doc]);
    //   }
    // });
  }

  private createStore(storeName: string) {
    this.stores[storeName] = localforage.createInstance({
      name: `${environment.bd_index_merch}`, // Asumiendo que este es el nombre de la base de datos deseado
      storeName: storeName // El nombre del almacén es el parámetro storeName
    });

    // Retornar la nueva instancia de almacenamiento
    return this.stores[storeName];
  }

  replaceCollectionWithNewList(storeName: string, newList: any[], collection: string = 'collection'): Promise<void> {
    // Limpiar la colección existente y agregar la nueva lista
    return this.getStore(storeName).setItem(collection, newList);
  }

  // Función para obtener todos los documentos de un almacén
  getAllDocuments(storeName: string, collection: string = `collection`): Promise<any[]> {
    const store = this.getStore(storeName);
    if (!store) {
      console.log(`El almacén ${storeName} no existe o no se pudo acceder a él.`);
      return Promise.resolve([]); // Retorna una promesa que se resuelve con un arreglo vacío
    }

    return store.getItem(`${collection}`).then((data: any[] | null) => {
      return data || [];
    }).catch((error: any) => {
      // Si ocurre un error (por ejemplo, al leer la colección), retorna un arreglo vacío
      console.log(`Error al obtener la colección ${collection} del almacén ${storeName}:`, error);
      return [];
    });

    // return this.getStore(storeName).getItem(`${collection}`).then((data: any[] | null) => {
    //   return data || [];
    // }).catch((error : any) => {
    //   // Si ocurre un error (por ejemplo, la colección no existe), retorna un arreglo vacío
    //   console.log(`Error al obtener la colección ${collection} del almacén ${storeName}:`, error);
    //   return [];
    // });
  }

  // getSecureAllDocuments(storeName: string, collection: string = `collection`): Promise<any[]> {
  //   return this.getStore(storeName).getItem(`${collection}`).then((data: string) => {
  //     const decrypted = CryptoJS.AES.decrypt(data, this.secretKey).toString(CryptoJS.enc.Utf8);
  //     return JSON.parse(decrypted) || [];
  //   });
  // }

  // Función para actualizar un documento en un almacén
  updateDocument(storeName: string, id: string, updatedDoc: any,collection: string = `collection`): Promise<void> {
    return this.getStore(storeName).getItem(`${collection}`).then((data: any[] | null) => {
      if (data) {
        const index = data.findIndex(doc => doc.id === id);
        if (index !== -1) {
          data[index] = updatedDoc;
          return this.getStore(storeName).setItem(`${collection}`, data);
        }
      }
      return Promise.reject('Document not found');
    });
  }

  // Función para actualizar un documento en un almacén
  updateStatePhoto(_id: string, imagen_url: string = '', name_file: string = ''): Promise<void> {
    return this.getStore(`${environment.tb_index_imagen}`).getItem(`collection`).then((data: any[] | null) => {
      if (data) {
        const index = data.findIndex(doc => doc._id === _id);
        if (index !== -1) {
          data[index].stateUploadAzure = true;
          data[index].imagen_url = imagen_url;
          data[index].name_file = name_file;
          return this.getStore(`${environment.tb_index_imagen}`).setItem(`collection`, data);
        }
      }
      return Promise.reject('Document not found');
    });
  }

  // Función para actualizar un documento en un almacén
  updateStateDocument(storeName: string, codeParent: string,collection: string = `collection`): Promise<void> {
    return this.getStore(storeName).getItem(`${collection}`).then((data: any[] | null) => {
      if (data) {
        const index = data.findIndex(doc => doc.codeParent === codeParent);
        if (index !== -1) {
          data[index].stateUploadAzure = true;
          return this.getStore(storeName).setItem(`${collection}`, data);
        }
      }
      return Promise.reject('Document not found');
    });
  }

  // Función para actualizar un documento en un almacén
  updateDocumentBy_Id(storeName: string, _id: string, updatedDoc: any,collection: string = `collection`): Promise<void> {
    return this.getStore(storeName).getItem(`${collection}`).then((data: any[] | null) => {
      if (data) {
        const index = data.findIndex(doc => doc._id === _id);
        if (index !== -1) {
          data[index] = updatedDoc;
          return this.getStore(storeName).setItem(`${collection}`, data);
        }
      }
      return Promise.reject('Document not found');
    });
  }

  // Método para obtener un documento por su _id en un almacén
  getDocumentBy_Id(storeName: string, _id: string, collection: string = 'collection'): Promise<any> {
    return this.getStore(storeName).getItem(`${collection}`).then((data: any[] | null) => {
      if (data) {
        const document = data.find(doc => doc._id === _id);
        if (document) {
          return document; // Documento encontrado
        }
      }
      return Promise.reject('Document not found'); // O puedes retornar Promise.resolve(null) si prefieres no lanzar un error
    });
  }

  // Función para eliminar un documento de un almacén
  async deleteDocument(storeName: string, id: string, collection: string = `collection`): Promise<void> {
    try {
      const data: any[] | null = await this.getStore(storeName).getItem(`${collection}`);
      if (data) {
        console.log('Original Collection:', data);
        // const updatedCollection = data.filter(doc => doc.id_store !== id);
        const updatedCollection = data.filter(doc => doc.codeParent !== id);
        console.log('Updated Collection:', updatedCollection);
        await this.getStore(storeName).setItem(`${collection}`, updatedCollection);
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error; // Re-throw para manejar el error más arriba si es necesario
    }
  }

  // Función para eliminar un documento de un almacén
  async deleteDocumentById(storeName: string, _id: string, collection: string = `collection`): Promise<void> {
    try {
      const data: any[] | null = await this.getStore(storeName).getItem(`${collection}`);
      if (data) {
        const updatedCollection = data.filter(doc => doc._id !== _id);
        await this.getStore(storeName).setItem(`${collection}`, updatedCollection);
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error; // Re-throw para manejar el error más arriba si es necesario
    }
  }
  // deleteDocument(storeName: string, id: string, collection: string = `collection`): Promise<void> {
  //   return this.getStore(storeName).getItem(`${collection}`).then((data: any[] | null) => {
  //     if (data) {
  //       const updatedCollection = data.filter(doc => doc.id_store !== id);
  //       return this.getStore(storeName).setItem(`${collection}`, updatedCollection);
  //     }
  //     return Promise.reject('Document not found');
  //   });
  // }
  public async deleteDatabase(): Promise<void> {
    const dbName = environment.bd_index_merch;
    try {
      await localforage.dropInstance({
        name: dbName
      });
      console.log(`Database ${dbName} successfully deleted`);
      this.initStores(); // Reinicializa los almacenes después de eliminar la base de datos
    } catch (error) {
      console.error(`Error deleting database ${dbName}:`, error);
      throw error;
    }
  }
}