const { Client, Account } = require('node-appwrite');
require('dotenv').config();

module.exports = async function(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setJWT(token);

        const account = new Account(client);
        const user = await account.get();
        
        // Populate req.user with Appwrite User object
        // Map $id to id for compatibility
        req.user = { 
            id: user.$id, 
            email: user.email, 
            name: user.name, 
            ...user 
        };
        
        next();
    } catch (ex) {
        console.error("Auth Middleware Error:", ex.message);
        res.status(401).json({ error: 'Invalid token or session expired.' });
    }
};
