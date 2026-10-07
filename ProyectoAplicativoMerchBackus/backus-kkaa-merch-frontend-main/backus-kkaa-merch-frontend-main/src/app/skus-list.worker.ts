/// <reference lib="webworker" />

import { StoreOfflineService } from "@shared/services/offline.service";

const storeOfflineService = new StoreOfflineService();

addEventListener('message', async ({ data }) => {
  const { backendUrl, token } = data;

  const headers = new Headers({
    'Authorization': `Bearer ${token}`
  });

  try {
    const response: any = await fetch(`${backendUrl}/api/v1/skus-offline`, { headers }); 
    const result = await response.json(); 

    // Almacenar la información en IndexedDB 
    // Almacenar la información usando StoreOfflineService
    await storeOfflineService.replaceCollectionWithNewList('sku', result);  
 
    postMessage({ success: true, data: result}); 
  } catch (error) {
    postMessage({ success: false, error }); 
  }
});
