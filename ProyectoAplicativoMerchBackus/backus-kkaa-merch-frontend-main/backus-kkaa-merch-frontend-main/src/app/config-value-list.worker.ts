/// <reference lib="webworker" />

import { StoreOfflineService } from "@shared/services/offline.service";

const storeOfflineService = new StoreOfflineService();

addEventListener('message', async ({ data }) => {
  const { backendUrl, token } = data;

  const headers = new Headers({
    'Authorization': `Bearer ${token}`
  });

  try {
    const response: any = await fetch(`${backendUrl}/api/v1/config/values`, { headers }); 
    const result = await response.json(); 
    console.log('result', result); 

    // Almacenar la información en IndexedDB 
    // Almacenar la información usando StoreOfflineService
    await storeOfflineService.replaceCollectionWithNewList('config_value', result?.result);  
 
    postMessage({ success: true, data: result}); 
  } catch (error) {
    postMessage({ success: false, error }); 
  }
});

function obtenerObjetosUnicosPorClave<T>(arreglo: T[], clave: keyof T): T[] {
  const unicosMap = new Map<any, T>();
  arreglo.forEach((objeto) => { 
    const valorClave = objeto[clave];
    if (!unicosMap.has(valorClave)) { 
      unicosMap.set(valorClave, objeto); 
    }
  });
  return Array.from(unicosMap.values()); 
}