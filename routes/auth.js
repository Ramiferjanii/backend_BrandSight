const express = require('express');
const router = express.Router();
const { users, Query } = require('../services/appwriteService');

// Debug Middleware to trace Auth Requests
router.use((req, res, next) => {
    console.log(`[AUTH ROUTE] ${req.method} ${req.originalUrl}`);
    next();
});

// Endpoint for frontend to fetch UserID by email (needed for existing user OTP flow)
router.post('/get-user-id', async (req, res) => {
    console.log(`[AUTH] Lookup request for: ${req.body.email}`);
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const response = await users.list([
            Query.equal('email', email)
        ]);

        if (response.users.length > 0) {
            console.log(`[AUTH] User found: ${response.users[0].$id}`);
            return res.json({ userId: response.users[0].$id, exists: true });
        } else {
            console.log(`[AUTH] User not found for email: ${email}`);
            return res.status(404).json({ error: "User not found", exists: false });
        }
    } catch (err) {
        console.error("[AUTH] Error looking up user:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Test Endpoint verify route loading
router.get('/test', (req, res) => {
    res.json({ message: "Auth Routes working on 5002", timestamp: new Date().toISOString() });
});

module.exports = router;
