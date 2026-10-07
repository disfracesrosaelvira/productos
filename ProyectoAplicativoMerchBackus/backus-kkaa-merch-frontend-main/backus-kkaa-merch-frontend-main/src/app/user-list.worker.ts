/// <reference lib="webworker" />

import { StoreOfflineService } from "@shared/services/offline.service";

const storeOfflineService = new StoreOfflineService();

addEventListener('message', async ({ data }) => {
  const { backendUrl, token } = data;

  const headers = new Headers({
    'Authorization': `Bearer ${token}`
  });


  try {
    const response: any = await fetch(`${backendUrl}/api/v1/usuarios-offline`, { headers });
    const result = await response.json();
    // const storeList = result?.listSucursales?.map((item: any) => ({ poc_nombre: `${item.poc_nombre}`, poc: `${item.poc}` }));

    // Almacenar la información en IndexedDB
    // Almacenar la información usando StoreOfflineService
    await storeOfflineService.replaceCollectionWithNewList('users', result, 'collection');

    postMessage({ success: true, data: result});
  } catch (error) {
    postMessage({ success: false, error });
  }
});
