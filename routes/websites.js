const express = require('express');
const router = express.Router();
const { databases, ID, client } = require('../services/appwriteService');
const { scrapeWebsiteTask } = require('../services/scraperService');
const { Query } = require('node-appwrite');
const auth = require('../middleware/auth'); // Import auth middleware

const DATABASE_ID = process.env.APPWRITE_DB_ID;
const WEBSITES_COLLECTION = process.env.APPWRITE_COLLECTION_WEBSITES;
const PRODUCTS_COLLECTION = process.env.APPWRITE_COLLECTION_PRODUCTS;

// Helper to format Appwrite document to our API format
const formatWebsite = (doc) => ({
    id: doc.$id,
    name: doc.name,
    url: doc.url,
    description: doc.description,
    category: doc.category,
    scrapeFrequency: doc.scrapeFrequency,
    isActive: doc.isActive,
    lastScraped: doc.lastScraped,
    lastScrapeStatus: doc.lastScrapeStatus || 'idle',
    scrapedData: doc.scrapedData ? JSON.parse(doc.scrapedData) : {},
    metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
    userId: doc.userId, // Include userId in output
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt
});

// CREATE: Add a new website
router.post('/', auth, async (req, res) => {
    try {
        const { name, url, description, category, scrapeFrequency, isActive, metadata } = req.body;

        if (!name || !url) {
            return res.status(400).json({ error: 'Name and URL are required fields' });
        }

        // duplicate check by URL (scoped to USER)
        const check = await databases.listDocuments(
            DATABASE_ID, 
            WEBSITES_COLLECTION, 
            [
                Query.equal('url', url),
                Query.equal('userId', req.user.id) // Check only user's websites
            ]
        );

        if (check.total > 0) {
            return res.status(409).json({ error: 'Website with this URL already exists' });
        }

        const payload = {
            name,
            url,
            description,
            category: category || 'general',
            scrapeFrequency: scrapeFrequency || 'on-demand',
            isActive: isActive !== undefined ? isActive : true,
            userId: req.user.id // Associate with user
        };

        const doc = await databases.createDocument(
            DATABASE_ID,
            WEBSITES_COLLECTION,
            ID.unique(),
            payload
        );

        res.status(201).json({
            message: 'Website created successfully',
            website: formatWebsite(doc)
        });
    } catch (error) {
        console.error('Error creating website:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ: Get all websites (Scoped to User)
router.get('/', auth, async (req, res) => {
    try {
        const { category, isActive, page, limit } = req.query;
        
        const pLimit = parseInt(limit) || 10;
        const pPage = parseInt(page) || 1;
        const pOffset = (pPage - 1) * pLimit;

        let queries = [
            Query.limit(pLimit),
            Query.offset(pOffset),
            Query.orderDesc('$createdAt'),
            Query.equal('userId', req.user.id)
        ];

        if (category && category.trim()) queries.push(Query.equal('category', category.trim()));
        if (isActive !== undefined) queries.push(Query.equal('isActive', isActive === 'true'));

        console.log(`DEBUG - Appwrite Websites Query: DB=${DATABASE_ID} COL=${WEBSITES_COLLECTION} User=${req.user.id}`);

        const result = await databases.listDocuments(DATABASE_ID, WEBSITES_COLLECTION, queries);

        res.json({
            websites: result.documents.map(formatWebsite),
            pagination: {
                total: result.total,
                page: pPage,
                limit: pLimit,
                totalPages: Math.ceil(result.total / pLimit)
            }
        });
    } catch (error) {
        console.error('--- APPWRITE WEBSITES ERROR ---');
        console.error('Message:', error.message);
        if (error.response) console.error('Response:', JSON.stringify(error.response));
        
        // Detect missing index error
        if (error.type === 'index_not_found' || (error.message && error.message.includes('Index not found'))) {
             console.error("CRITICAL: Missing Appwrite Index. Please run 'node backend/fix-indices.js'");
             return res.status(500).json({ error: "Database Configuration Error: Missing Index", details: "The 'userId' or 'category' index is missing in Appwrite." });
        }

        res.status(500).json({ error: error.message, details: error.response?.message });
    }
});

// READ: Get single website
router.get('/:id', auth, async (req, res) => {
    try {
        const doc = await databases.getDocument(DATABASE_ID, WEBSITES_COLLECTION, req.params.id);
        
        // Check ownership
        if (doc.userId && doc.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ website: formatWebsite(doc) });
    } catch (error) {
        res.status(404).json({ error: 'Website not found' });
    }
});

// UPDATE: Update a website
router.put('/:id', auth, async (req, res) => {
    try {
        // Verify ownership first
        const existing = await databases.getDocument(DATABASE_ID, WEBSITES_COLLECTION, req.params.id);
        if (existing.userId && existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { name, url, description, category, scrapeFrequency, isActive, metadata } = req.body;
        
        const updates = {};
        if (name) updates.name = name;
        if (url) updates.url = url;
        if (description) updates.description = description;
        if (category) updates.category = category;
        if (scrapeFrequency) updates.scrapeFrequency = scrapeFrequency;
        if (isActive !== undefined) updates.isActive = isActive;

        const doc = await databases.updateDocument(
            DATABASE_ID,
            WEBSITES_COLLECTION,
            req.params.id,
            updates
        );

        res.json({
            message: 'Website updated successfully',
            website: formatWebsite(doc)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
    try {
        // Verify ownership
        const existing = await databases.getDocument(DATABASE_ID, WEBSITES_COLLECTION, req.params.id);
        if (existing.userId && existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await databases.deleteDocument(DATABASE_ID, WEBSITES_COLLECTION, req.params.id);
        res.json({ message: 'Website deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// TRIGGER SCRAPE
router.post('/:id/scrape-trigger', auth, async (req, res) => {
    try {
        const websiteId = req.params.id;
        const { mode = 'static', url, filters } = req.body;

        // Verify existence and ownership
        const website = await databases.getDocument(DATABASE_ID, WEBSITES_COLLECTION, websiteId);
        if (website.userId && website.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Determine target URL: Custom URL > Website Default URL
        const targetUrl = url && url.trim() ? url.trim() : website.url;

        if (!targetUrl || !targetUrl.trim()) {
            return res.status(400).json({ error: 'Website URL is missing or invalid' });
        }

        console.log(`Triggering Scrape for ${website.name}. URL: ${targetUrl}, Mode: ${mode}`);
        if (filters) {
            console.log(`Filters applied:`, filters);
        }

        // Run Task Asynchronously with filters AND userId
        scrapeWebsiteTask(websiteId, mode, targetUrl.trim(), filters, req.user.id)
            .then(() => console.log(`Scraping task for ${websiteId} completed.`))
            .catch(err => console.error(`Scraping task for ${websiteId} failed:`, err));

        res.status(202).json({
            message: `Scraping started in background. Status will update shortly.`,
            status: 'in-progress',
            filters: filters || null
        });
    } catch (error) {
        console.error('Scrape trigger error:', error);
        res.status(500).json({ error: error.message });
    }
});

// SEED: Default Websites & Schema Migration
router.post('/seed', async (req, res) => {
    try {
        const defaults = [
            {
                name: "Tunisianet",
                url: "https://www.tunisianet.com.tn",
                category: "Electronics",
                description: "Vente PC portable Tunisie, ordinateur de bureau, Smartphones...",
                scrapeFrequency: "daily"
            },
            {
                name: "MyTek",
                url: "https://www.mytek.tn",
                category: "Electronics",
                description: "Vente en ligne de PC portables, Smartphones, Electroménager...",
                scrapeFrequency: "daily"
            },
            {
                name: "Wiki",
                url: "https://www.wiki.tn",
                category: "Electronics",
                description: "Vente en ligne Informatique, High Tech, Électroménager...",
                scrapeFrequency: "daily"
            }
        ];

        const results = [];

        // 1. Ensure Schema Attributes Exist
        try {
             // We reuse the existing database client method if possible, or fallback
             if (databases.createFloatAttribute) {
                 const PRODUCTS = process.env.APPWRITE_COLLECTION_PRODUCTS;
                 
                 await databases.createFloatAttribute(DATABASE_ID, PRODUCTS, 'priceAmount', false).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'category', 255, false).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'name', 255, true).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'price', 255, false).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'reference', 255, false).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'overview', 5000, false).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'url', 1000, true).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'domain', 255, false).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'image', 1000, false).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'websiteId', 255, true).catch(() => {});
                 
                 // NEW: userId attribute for Data Isolation
                 await databases.createStringAttribute(DATABASE_ID, PRODUCTS, 'userId', 255, false).catch(() => {});
                 await databases.createStringAttribute(DATABASE_ID, WEBSITES_COLLECTION, 'userId', 255, false).catch(() => {});
                 
                 await databases.createStringAttribute(DATABASE_ID, WEBSITES_COLLECTION, 'lastScrapeStatus', 50, false).catch(() => {});
             }
        } catch (e) {
            console.log("Schema migration note: " + e.message);
        }

        // 2. Seed Websites (Global seed)
        for (const site of defaults) {
            const check = await databases.listDocuments(
                DATABASE_ID, 
                WEBSITES_COLLECTION, 
                [Query.equal('url', site.url)]
            );

            if (check.total === 0) {
                const doc = await databases.createDocument(
                    DATABASE_ID,
                    WEBSITES_COLLECTION,
                    ID.unique(),
                    {
                        ...site,
                        isActive: true,
                        scrapeFrequency: 'daily'
                        // Global seed has no userId
                    }
                );
                results.push({ name: site.name, status: 'created', id: doc.$id });
            } else {
                results.push({ name: site.name, status: 'exists', id: check.documents[0].$id });
            }
        }

        res.json({ message: 'Seeding completed', results });
    } catch (error) {
        console.error('Seeding error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
