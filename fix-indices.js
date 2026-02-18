
const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const DATABASE_ID = process.env.APPWRITE_DB_ID;
const WEBSITES_COLLECTION = process.env.APPWRITE_COLLECTION_WEBSITES;
const PRODUCTS_COLLECTION = process.env.APPWRITE_COLLECTION_PRODUCTS;

async function createIndexIfNotExists(collectionId, key, type, attributes) {
    try {
        console.log(`Checking index '${key}' in collection '${collectionId}'...`);
        try {
             // Try to list indexes to find if it exists
             const indexList = await databases.listIndexes(DATABASE_ID, collectionId);
             const exists = indexList.indexes.some(d => d.key === key);
             
            if (exists) {
                 console.log(`Index '${key}' already exists.`);
                 return;
            }
            
            console.log(`Creating index '${key}'...`);
            await databases.createIndex(DATABASE_ID, collectionId, key, type, attributes);
            console.log(`Index '${key}' creation started.`);
            
        } catch (e) {
            console.error(`Error checking/creating index '${key}':`, e.message);
        }
    } catch (e) {
        console.error(`Error with index '${key}':`, e.message);
    }
}

async function fixIndices() {
    console.log('Starting Index Fixes...');
    
    // Websites Collection Indices
    if (WEBSITES_COLLECTION) {
        await createIndexIfNotExists(WEBSITES_COLLECTION, 'idx_userId', 'key', ['userId']);
        await createIndexIfNotExists(WEBSITES_COLLECTION, 'idx_category', 'key', ['category']);
        await createIndexIfNotExists(WEBSITES_COLLECTION, 'idx_isActive', 'key', ['isActive']);
    }

    // Products Collection Indices
    if (PRODUCTS_COLLECTION) {
        // Appwrite requires indexes for any field used in equal/search/order
        await createIndexIfNotExists(PRODUCTS_COLLECTION, 'idx_userId', 'key', ['userId']);
        await createIndexIfNotExists(PRODUCTS_COLLECTION, 'idx_url', 'key', ['url']);
        await createIndexIfNotExists(PRODUCTS_COLLECTION, 'idx_websiteId', 'key', ['websiteId']);
        await createIndexIfNotExists(PRODUCTS_COLLECTION, 'idx_domain', 'key', ['domain']);
        await createIndexIfNotExists(PRODUCTS_COLLECTION, 'idx_category', 'key', ['category']);
        await createIndexIfNotExists(PRODUCTS_COLLECTION, 'idx_priceAmount', 'key', ['priceAmount']); // for sorting/range
    }

    console.log('Index fixes completed. Waiting for Appwrite to process...');
    console.log('NOTE: Index creation is async. It may take a few minutes before 500 errors disappear.');
}

fixIndices();
