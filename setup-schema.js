const { databases } = require('./services/appwriteService');
require('dotenv').config();

const DATABASE_ID = process.env.APPWRITE_DB_ID;
const PRODUCTS_COLLECTION = process.env.APPWRITE_COLLECTION_PRODUCTS;

async function setupSchema() {
    if (!DATABASE_ID || !PRODUCTS_COLLECTION) {
        console.error('Error: APPWRITE_DB_ID or APPWRITE_COLLECTION_PRODUCTS not set in .env');
        return;
    }

    console.log('Checking Appwrite Schema for Products Collection...');
    
    try {
        // 1. Check existing attributes
        const { attributes } = await databases.listAttributes(DATABASE_ID, PRODUCTS_COLLECTION);
        const existingAttrKeys = attributes.map(a => a.key);
        console.log('Existing attributes:', existingAttrKeys.join(', ') || 'None');

        // 2. Define required attributes
        const requiredAttributes = [
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'price', type: 'string', size: 255, required: false },
            { key: 'priceAmount', type: 'double', required: false },
            { key: 'reference', type: 'string', size: 255, required: false },
            { key: 'overview', type: 'string', size: 5000, required: false },
            { key: 'category', type: 'string', size: 100, required: false },
            { key: 'url', type: 'string', size: 1000, required: true },
            { key: 'domain', type: 'string', size: 100, required: false },
            { key: 'websiteId', type: 'string', size: 50, required: true },
            { key: 'scrapedAt', type: 'datetime', required: false }
        ];

        // 3. Create missing attributes
        for (const attr of requiredAttributes) {
            if (!existingAttrKeys.includes(attr.key)) {
                console.log(`Creating attribute: ${attr.key} (${attr.type})...`);
                try {
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION, attr.key, attr.size, attr.required);
                    } else if (attr.type === 'double') {
                        await databases.createFloatAttribute(DATABASE_ID, PRODUCTS_COLLECTION, attr.key, attr.required);
                    } else if (attr.type === 'datetime') {
                        await databases.createDatetimeAttribute(DATABASE_ID, PRODUCTS_COLLECTION, attr.key, attr.required);
                    }
                    console.log(`✓ Created attribute: ${attr.key}`);
                    // Wait briefly as attribute creation is async
                    await new Promise(r => setTimeout(r, 1000));
                } catch (err) {
                    console.error(`✗ Failed to create attribute ${attr.key}:`, err.message);
                }
            }
        }

        console.log('Waiting for attributes to be available...');
        await new Promise(r => setTimeout(r, 3000));

        // 4. Create Indexes (Retry)
        const { indexes } = await databases.listIndexes(DATABASE_ID, PRODUCTS_COLLECTION);
        const existingIndexKeys = indexes.map(idx => idx.key);

        const indexesToCreate = [
            { key: 'idx_category', type: 'key', attributes: ['category'] },
            { key: 'idx_websiteId', type: 'key', attributes: ['websiteId'] },
            { key: 'idx_priceAmount', type: 'key', attributes: ['priceAmount'] },
            { key: 'idx_scrapedAt', type: 'key', attributes: ['scrapedAt'] },
            { key: 'idx_name_search', type: 'fulltext', attributes: ['name'] }
        ];

        for (const idx of indexesToCreate) {
             // Appwrite only allows creating index if attributes exist and are available
            if (!existingIndexKeys.includes(idx.key)) {
                console.log(`Creating index: ${idx.key}...`);
                try {
                    await databases.createIndex(
                        DATABASE_ID, 
                        PRODUCTS_COLLECTION, 
                        idx.key, 
                        idx.type, 
                        idx.attributes
                    );
                    console.log(`✓ Created index: ${idx.key}`);
                } catch (err) {
                    console.error(`✗ Failed to create index ${idx.key}:`, err.message);
                }
            }
        }

        console.log('Schema setup complete!');

    } catch (error) {
        console.error('Error in setupSchema:', error);
    }
}

setupSchema();
