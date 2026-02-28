const { supabase } = require('../services/supabaseService');

module.exports = async function(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new Error(error?.message || 'Invalid token');
        }
        
        req.user = { 
            id: user.id, 
            email: user.email, 
            ...user.user_metadata 
        };
        
        next();
    } catch (ex) {
        console.error("Auth Middleware Error:", ex.message);
        res.status(401).json({ error: 'Invalid token or session expired.' });
    }
};

