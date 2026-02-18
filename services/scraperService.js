const { spawn } = require('child_process');
const path = require('path');
const { databases, ID } = require('../services/appwriteService');
const { Query } = require('node-appwrite');

const DATABASE_ID = process.env.APPWRITE_DB_ID;
const WEBSITES_COLLECTION = process.env.APPWRITE_COLLECTION_WEBSITES;
const PRODUCTS_COLLECTION = process.env.APPWRITE_COLLECTION_PRODUCTS;

/**
 * Scrapes a website using the Python scraper script.
 * @param {string} websiteId - The Document ID of the website in Appwrite
 * @param {string} mode - 'static' or 'selenium'
 * @returns {Promise<Object>} - The updated data
 */
async function scrapeWebsiteTask(websiteId, mode = 'static', url, filters = {}, userId = null) {
    if (!url) {
       console.error(`ERROR: URL is missing for website task: ID=${websiteId}`);
       throw new Error("URL is required for scraping");
    }
    console.log(`Starting scrapeWebsiteTask for ID: ${websiteId}, Mode: ${mode}, URL: ${url}`);

    return new Promise((resolve, reject) => {
        // ... (lines 24-110 omitted for brevity, logic remains same)
        const fs = require('fs');
        let pythonPath = 'python'; // Default system fallback

        // Potential paths for virtual environment python
        const venvPath = path.join(__dirname, '../../.venv/Scripts/python.exe');
        const venvPathUnix = path.join(__dirname, '../../.venv/bin/python');

        if (fs.existsSync(venvPath)) {
            pythonPath = venvPath;
        } else if (fs.existsSync(venvPathUnix)) {
            pythonPath = venvPathUnix;
        }

        const scriptPath = path.join(__dirname, '../python_scraper/scraper.py');

        console.log(`Executing Python scraper using: ${pythonPath} for ID: ${websiteId}`);

        // Build arguments with filters
        const args = [scriptPath, websiteId, mode, url || ''];
        
        // Add filter arguments if provided
        if (filters?.minPrice) args.push('--minPrice', String(filters.minPrice));
        if (filters?.maxPrice) args.push('--maxPrice', String(filters.maxPrice));
        if (filters?.name) args.push('--nameFilter', String(filters.name));
        if (filters?.reference) args.push('--referenceFilter', String(filters.reference));
        
        console.log(`Python args:`, args);
        const pythonProcess = spawn(pythonPath, args);

        pythonProcess.on('error', async (err) => {
            console.error('Failed to start Python process:', err);
            // Status tracking removed - field doesn't exist in schema
            reject(new Error(`Failed to start Python process: ${err.message}`));
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            const str = data.toString();
            output += str;
            console.log(`Python stdout: ${str}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Python stderr: ${errorOutput}`);
                // Status tracking removed
                return reject(new Error(`Python process exited with code ${code}. Error: ${errorOutput}`));
            }

            try {
                // Find the JSON line in the output
                const lines = output.trim().split('\n');
                let result = null;

                for (let i = lines.length - 1; i >= 0; i--) {
                    try {
                        result = JSON.parse(lines[i]);
                        break;
                    } catch (e) { continue; }
                }

                if (result && result.error) {
                    // Status tracking removed
                    return reject(new Error(result.error));
                }

                if (!result || !result.data) {
                    // Status tracking removed
                    throw new Error('No valid JSON output found from Python script');
                }

                const data = result.data;
                const items = (data.type === 'list' && Array.isArray(data.data)) ? data.data : [data];
                
                // Add count to the data for frontend display
                if (data.type === 'list') {
                    data.count = items.length;
                }
                
                console.log(`Scraper returned ${items.length} items`);

                // 2. Update Website Document in Appwrite (Success)
                const now = new Date().toISOString();
                await databases.updateDocument(
                    DATABASE_ID,
                    WEBSITES_COLLECTION,
                    websiteId,
                    {
                        scrapedData: JSON.stringify(data),
                        lastScraped: now
                    }
                );

                // 3. Create/Update Product in Appwrite
                for (const item of items) {
                    try {
                        let itemUrl = item.url || url;
                        if (!itemUrl) continue;
                        
                        // Upsert logic
                        const existingProducts = await databases.listDocuments(
                            DATABASE_ID,
                            PRODUCTS_COLLECTION,
                            [Query.equal('url', itemUrl)] 
                        );

                        const productPayload = {
                            name: item.name || 'Unknown',
                            price: item.price || 'Not found',
                            priceAmount: parseFloat(item.priceAmount || 0.0), 
                            reference: item.reference || '',
                            overview: item.overview || '',
                            category: item.category || '',
                            url: itemUrl,
                            image: item.image || '',
                            websiteId: websiteId,
                            scrapedAt: now,
                            userId: userId // Data Isolation: Associate with User
                        };
                        
                        // Domain fallback
                        if (item.domain) productPayload.domain = item.domain;

                        if (existingProducts.total > 0) {
                            const existingId = existingProducts.documents[0].$id;
                            await databases.updateDocument(
                                DATABASE_ID,
                                PRODUCTS_COLLECTION,
                                existingId,
                                productPayload
                            );
                        } else {
                            await databases.createDocument(
                                DATABASE_ID,
                                PRODUCTS_COLLECTION,
                                ID.unique(),
                                productPayload
                            );
                        }
                    } catch (err) {
                        console.error(`Failed to save item ${item.name}:`, err.message);
                    }
                }

                resolve(data);
            } catch (err) {
                console.error('Failed to parse/save Python output:', err);
                // Status tracking removed
                reject(new Error(`Failed to process scraper results: ${err.message}`));
            }
        });
    });
}

module.exports = {
    scrapeWebsiteTask
};
