const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.js');
const websiteRoutes = require('./routes/websites.js');
require('./database'); // Initialize DB connection
const port = 5000;

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS headers (extra layer)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/websites', websiteRoutes);

// API Info endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Express REST API - BrandSight',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login'
            },
            websites: {
                create: 'POST /api/websites',
                getAll: 'GET /api/websites',
                getById: 'GET /api/websites/:id',
                update: 'PUT /api/websites/:id',
                updateScrapeData: 'PATCH /api/websites/:id/scrape',
                triggerScrape: 'POST /api/websites/:id/scrape-trigger',
                delete: 'DELETE /api/websites/:id',
                bulkDelete: 'POST /api/websites/bulk-delete'
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
    console.log(`REST API Server running on http://localhost:${port}`);
    console.log(`API Documentation: http://localhost:${port}/`);
});
