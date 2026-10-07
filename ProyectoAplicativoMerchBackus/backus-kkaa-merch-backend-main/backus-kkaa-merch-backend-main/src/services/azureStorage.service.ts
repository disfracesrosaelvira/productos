import { BlobServiceClient } from '@azure/storage-blob';
import { ADLS_CONTAINER, ADLS_HOST, ADLS_SAS_TOKEN } from '../config';

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    this.blobServiceClient = new BlobServiceClient(`${ADLS_HOST}/${ADLS_CONTAINER}?${ADLS_SAS_TOKEN}`);
  }

  uploadFile = async (containerName: string, file: any, blobName: string) => {
    try {
     
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const uploadOptions = {
        blobHTTPHeaders: {
              // blobContentType: 'image/jpeg'
              blobContentType: 'image/webp'
          }
      };
      const uploadBlobResponse = await blockBlobClient.upload(file.buffer, file.size || file.length,uploadOptions);
      console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);
      return blockBlobClient.url;
    } catch (error) {
      console.error('#######  Error al subir archivo', error);
    }
  }

  downloadFile = async (containerName: string, blobName: string, downloadPath: string = '') => {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      console.log(`Download blob ${blobName} successfully`, blockBlobClient.url);
      return blockBlobClient.url;
    } catch (error) {
      console.error('#######  Error al descargar archivo', error);
    }
  }

  deleteFile = async (containerName: string, blobName: string) => {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
      const deleteBlobResponse = await blockBlobClient.delete();
      console.log(`Delete block blob ${blobName} successfully`, deleteBlobResponse.requestId);
    } catch (error) {
      console.error('#######  Error al eliminar archivo', error);
    }
  }
  
  // Aquí puedes agregar más métodos para otras operaciones que quieras realizar con Azure Blob Storage
}
