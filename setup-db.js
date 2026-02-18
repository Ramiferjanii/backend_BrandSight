const { databases } = require('./services/appwriteService');
require('dotenv').config();

const DATABASE_ID = process.env.APPWRITE_DB_ID;
const PRODUCTS_COLLECTION = process.env.APPWRITE_COLLECTION_PRODUCTS;

async function setupIndexes() {
    if (!DATABASE_ID || !PRODUCTS_COLLECTION) {
        console.error('Error: APPWRITE_DB_ID or APPWRITE_COLLECTION_PRODUCTS not set in .env');
        return;
    }

    console.log('Checking Appwrite Indexes for Products Collection...');
    console.log('Database ID:', DATABASE_ID);
    console.log('Collection ID:', PRODUCTS_COLLECTION);

    try {
        // 1. Check Attributes first (optional, but good for verification)
        // const attrs = await databases.listAttributes(DATABASE_ID, PRODUCTS_COLLECTION);
        // console.log('Attributes found:', attrs.attributes.map(a => a.key).join(', '));

        // 2. Check and Create Indexes
        const existingIndexes = await databases.listIndexes(DATABASE_ID, PRODUCTS_COLLECTION);
        const indexKeys = existingIndexes.indexes.map(idx => idx.key);

        console.log('Existing indexes:', indexKeys.join(', '));

        const indexesToCreate = [
            { key: 'idx_category', type: 'key', attributes: ['category'] },
            { key: 'idx_websiteId', type: 'key', attributes: ['websiteId'] },
            { key: 'idx_priceAmount', type: 'key', attributes: ['priceAmount'] }, // For sorting and range
            { key: 'idx_scrapedAt', type: 'key', attributes: ['scrapedAt'] }, // For sorting
            { key: 'idx_name_search', type: 'fulltext', attributes: ['name'] } // For search
        ];

        for (const idx of indexesToCreate) {
            if (!indexKeys.includes(idx.key)) {
                console.log(`Creating index: ${idx.key}...`);
                try {
                    // Note: createIndex(databaseId, collectionId, key, type, attributes, orders)
                    // orders is optional and mostly for key indexes to specify sort order capability? No, usually not needed for simple key.
                    await databases.createIndex(
                        DATABASE_ID, 
                        PRODUCTS_COLLECTION, 
                        idx.key, 
                        idx.type, 
                        idx.attributes
                    );
                    console.log(`✓ Created index: ${idx.key}`);
                    // Wait a bit? Appwrite handles it async.
                } catch (err) {
                    console.error(`✗ Failed to create index ${idx.key}:`, err.message);
                }
            } else {
                console.log(`✓ Index already exists: ${idx.key}`);
            }
        }
        
    } catch (error) {
        console.error('Error setup:', error);
    }
}

setupIndexes();
