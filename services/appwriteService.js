const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client();

if (process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY) {
    const projectId = process.env.APPWRITE_PROJECT_ID;
    console.log(`[Appwrite Service] Initializing with Project ID: ${projectId.substring(0, 5)}...${projectId.substring(projectId.length - 3)}`);
    console.log(`[Appwrite Service] Endpoint: ${process.env.APPWRITE_ENDPOINT}`);
    
    client
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(projectId)
        .setKey(process.env.APPWRITE_API_KEY);
} else {
    console.warn("⚠️ Appwrite environment variables are missing. Please check .env file.");
}

const databases = new sdk.Databases(client);
const users = new sdk.Users(client);
const storage = new sdk.Storage(client);

module.exports = {
    client,
    databases,
    storage,
    users,
    Query: sdk.Query,
    ID: sdk.ID
};
