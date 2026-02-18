const express = require('express');
const router = express.Router();
const { databases } = require('../services/appwriteService');
const { Query } = require('node-appwrite');
const auth = require('../middleware/auth');

const DATABASE_ID = process.env.APPWRITE_DB_ID;
const PRODUCTS_COLLECTION = process.env.APPWRITE_COLLECTION_PRODUCTS;

// Helper to format Appwrite document to API format
const formatProduct = (doc) => ({
    id: doc.$id,
    name: doc.name,
    price: doc.price,
    priceAmount: doc.priceAmount,
    reference: doc.reference,
    overview: doc.overview,
    category: doc.category,
    url: doc.url,
    image: doc.image || '',
    domain: doc.domain,
    websiteId: doc.websiteId,
    userId: doc.userId, // Include userId
    scrapedAt: doc.scrapedAt,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt
});

// GET: List products with filtering (Protected)
router.get('/', auth, async (req, res) => {
    try {
        const { 
            minPrice, 
            maxPrice, 
            name, 
            category, 
            websiteId, 
            domain,
            page, 
            limit 
        } = req.query;

        // Ensure we have numbers for pagination
        const pLimit = parseInt(limit) || 20;
        const pPage = parseInt(page) || 1;
        const pOffset = (pPage - 1) * pLimit;

        let queries = [
            Query.limit(pLimit),
            Query.offset(pOffset),
            Query.orderDesc('$createdAt'),
            Query.equal('userId', req.user.id)
        ];
        
        console.log(`DEBUG - Appwrite Products Query: DB=${DATABASE_ID} COL=${PRODUCTS_COLLECTION} User=${req.user.id} Limit=${pLimit} Offset=${pOffset}`);

        // Price range filtering
        if (minPrice && !isNaN(parseFloat(minPrice))) {
            queries.push(Query.greaterThanEqual('priceAmount', parseFloat(minPrice)));
        }
        if (maxPrice && !isNaN(parseFloat(maxPrice))) {
            queries.push(Query.lessThanEqual('priceAmount', parseFloat(maxPrice)));
        }

        // Name search (partial match using search)
        if (name && name.trim()) {
            queries.push(Query.search('name', name.trim()));
        }

        // Category filter
        if (category && category.trim()) {
            queries.push(Query.equal('category', category.trim()));
        }

        // Website filter
        if (websiteId && websiteId.trim()) {
            queries.push(Query.equal('websiteId', websiteId.trim()));
        }

        // Domain filter
        if (domain && domain.trim()) {
            queries.push(Query.equal('domain', domain.trim()));
        }

        const result = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION, queries);

        res.json({
            products: result.documents.map(formatProduct),
            pagination: {
                total: result.total,
                page: pPage,
                limit: pLimit,
                totalPages: Math.ceil(result.total / pLimit)
            }
        });
    } catch (error) {
        console.error('--- APPWRITE QUERY ERROR ---');
        console.error('Message:', error.message);
        
        // Detect missing index error
        if (error.type === 'index_not_found' || (error.message && error.message.includes('Index not found'))) {
             console.error("CRITICAL: Missing Appwrite Index. Please run 'node backend/fix-indices.js'");
             return res.status(500).json({ error: "Database Configuration Error: Missing Index", details: "The 'userId' index is missing in Appwrite Products collection." });
        }

        if (error.response) {
            console.error('Response:', JSON.stringify(error.response));
        }
        res.status(500).json({ 
            error: error.message,
            type: error.type,
            details: error.response?.message || null 
        });
    }
});

// GET: Get single product by ID (Protected)
router.get('/:id', auth, async (req, res) => {
    try {
        const doc = await databases.getDocument(DATABASE_ID, PRODUCTS_COLLECTION, req.params.id);
        
        // Ownership check
        if (doc.userId && doc.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ product: formatProduct(doc) });
    } catch (error) {
        res.status(404).json({ error: 'Product not found' });
    }
});

module.exports = router;
