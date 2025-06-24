// utils/azureBlobHelper.js
const { BlobServiceClient } = require('@azure/storage-blob');

// const AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=sakhastore;AccountKey=YOUR_KEY_HERE;End pointSuffix=core.windows.net';
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

console.log ("Photo connection string is " +AZURE_STORAGE_CONNECTION_STRING)
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

async function uploadToAzure(buffer, blobName, contentType) {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType }
  });
  return blockBlobClient.url;
}

async function deleteFromAzure(blobName) {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

module.exports = { uploadToAzure, deleteFromAzure };
