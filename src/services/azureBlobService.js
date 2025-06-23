        // D:\1. Data\1. Personal DOcument\00.SM\NewProject\dev\SMKalyanBE\src\services\azureBlobService.js

        const { BlobServiceClient } = require('@azure/storage-blob');

        // Retrieve connection string from environment variables for security.
        // It's assumed that `dotenv.config()` is called in your main server file (e.g., server.js).
        const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

        // Ensure the connection string is available
        if (!AZURE_STORAGE_CONNECTION_STRING) {
          console.error('CRITICAL ERROR: Azure Storage Connection String (AZURE_STORAGE_CONNECTION_STRING) is not set in environment variables.');
          // Throwing an error here will stop the server if the variable is missing
          throw new Error("Azure Storage Connection String is missing. Check .env file and server.js dotenv config.");
        }

        let blobServiceClient;
        try {
            blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
            console.log('[DEBUG-AZURE] BlobServiceClient initialized successfully (from env variable).');
        } catch (e) {
            console.error('CRITICAL ERROR: Failed to create BlobServiceClient. Please check AZURE_STORAGE_CONNECTION_STRING format and validity in your .env file or Azure App Service configuration.', e.message);
            throw new Error("Blob Service Client initialization failed: " + e.message);
        }

        const CONTAINER_NAME = "profilephotos"; // This is the name of your Azure Blob container

        /**
         * Ensures the specified Azure Blob container exists.
         * This function is useful for initial setup and development environments.
         * In a production setup, the container would typically be pre-created.
         */
        const ensureContainerExists = async () => {
            if (!blobServiceClient) {
                console.error('BlobServiceClient not initialized. Cannot ensure container exists. Check connection string.');
                return; // Exit gracefully if client isn't ready
            }
            const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
            try {
                const createContainerResponse = await containerClient.createIfNotExists();
                if (createContainerResponse.succeeded) {
                    console.log(`[DEBUG-AZURE] Azure Blob container "${CONTAINER_NAME}" created successfully.`);
                } else {
                    console.log(`[DEBUG-AZURE] Azure Blob container "${CONTAINER_NAME}" already exists.`);
                }
            } catch (error) {
                console.error(`ERROR: Failed to ensure Azure Blob container "${CONTAINER_NAME}" exists:`, error.message);
                throw error; // Re-throw to propagate critical setup issues
            }
        };

        /**
         * Uploads a file buffer to Azure Blob Storage.
         *
         * @param {string} blobName - The desired unique name for the blob within the container.
         * @param {Buffer} fileBuffer - The Node.js Buffer containing the binary data of the file.
         * @param {string} contentType - The MIME type of the file (e.g., 'image/jpeg', 'image/png').
         * @returns {Promise<string>} A promise that resolves with the full public URL of the uploaded blob.
         */
        async function uploadFileToAzureBlob(blobName, fileBuffer, contentType) {
            if (!blobServiceClient) {
                throw new Error('Azure Blob Service Client not initialized. Cannot upload. Check connection string setup.');
            }
            if (!blobName || !fileBuffer || !contentType) {
                throw new Error("Missing required parameters (blobName, fileBuffer, contentType) for Azure upload.");
            }

            const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
            console.log(`[DEBUG-AZURE] Got container client for "${CONTAINER_NAME}".`);

            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            console.log(`[DEBUG-AZURE] Got block blob client for "${blobName}". Target URL: ${blockBlobClient.url}`);

            console.log(`[DEBUG-AZURE] Attempting to upload blob: "${blobName}" (MIME: ${contentType}, Size: ${fileBuffer.length} bytes)...`);

            try {
                const uploadOptions = {
                    blobHTTPHeaders: { blobContentType: contentType },
                    // Add a timeout if needed, e.g., timeout: 60 * 1000 (60 seconds)
                };
                console.log('[DEBUG-AZURE] Calling blockBlobClient.uploadData...');
                await blockBlobClient.uploadData(fileBuffer, uploadOptions);
                console.log(`[DEBUG-AZURE] File "${blobName}" uploaded successfully to Azure Blob Storage.`);
                return blockBlobClient.url;
            } catch (error) {
                console.error(`ERROR: Failed to upload file "${blobName}" to Azure Blob Storage:`, error.message);
                if (error.details) {
                    console.error(`ERROR DETAILS:`, JSON.stringify(error.details, null, 2));
                }
                throw error; // Re-throw the error for upstream handling
            }
        }

        /**
         * Deletes a blob from Azure Blob Storage.
         *
         * @param {string} blobName - The unique name of the blob to delete from within the container.
         * @returns {Promise<void>} A promise that resolves when the blob is deleted (or if it didn't exist).
         */
        async function deleteFileFromAzureBlob(blobName) {
            if (!blobServiceClient) {
                throw new Error('Azure Blob Service Client not initialized. Cannot delete. Check connection string setup.');
            }
            if (!blobName) {
                throw new Error("Missing blobName for Azure deletion.");
            }

            const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            console.log(`[DEBUG-AZURE] Attempting to delete blob: "${blobName}"...`);

            try {
                const deleteResponse = await blockBlobClient.deleteIfExists(); // Use deleteIfExists to avoid errors if blob doesn't exist
                if (deleteResponse.succeeded) {
                    console.log(`[DEBUG-AZURE] File "${blobName}" deleted from Azure Blob Storage.`);
                } else {
                    console.log(`[DEBUG-AZURE] File "${blobName}" did not exist in Azure Blob Storage (no action needed).`);
                }
            } catch (error) {
                console.error(`ERROR: Failed to delete file "${blobName}" from Azure Blob Storage:`, error.message);
                throw error; // Re-throw the error for upstream handling
            }
        }

        module.exports = {
            uploadFileToAzureBlob,
            deleteFileFromAzureBlob,
            ensureContainerExists
        };
        