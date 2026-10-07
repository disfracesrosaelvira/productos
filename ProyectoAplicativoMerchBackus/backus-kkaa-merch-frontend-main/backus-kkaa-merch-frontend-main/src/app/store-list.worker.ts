/// <reference lib="webworker" />

import { StoreOfflineService } from "@shared/services/offline.service";

const storeOfflineService = new StoreOfflineService();

addEventListener('message', async ({ data }) => {
  const { backendUrl, token, rol, user_id } = data;

  const headers = new Headers({
    'Authorization': `Bearer ${token}`
  });

  const params = new URLSearchParams({
    'page_index': '1',
    'page_size': '10',
    'rol': rol,
    'user_id': user_id,
    'filter': '',
    'is_paginate': 'false'
  });

  try {
    const response: any = await fetch(`${backendUrl}/api/v1/store4UserType?${params.toString()}`, { headers });
    const result = await response.json();
    const storeList = result?.listSucursales?.map((item: any) => ({ poc_nombre: `${item.poc_nombre}`, poc: `${item.poc}` }));

    // Almacenar la información en IndexedDB
    // Almacenar la información usando StoreOfflineService
    await storeOfflineService.replaceCollectionWithNewList('poc', storeList, 'collection');

    postMessage({ success: true, data: result});
  } catch (error) {
    postMessage({ success: false, error });
  }
});
