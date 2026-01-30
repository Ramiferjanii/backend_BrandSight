const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.js');
require('./database'); // Initialize DB connection
const port = 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);

// API Info endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Express REST API',
        version: '1.0.0',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
    console.log(`REST API Server running on http://localhost:${port}`);
    console.log(`API Documentation: http://localhost:${port}/`);
});
