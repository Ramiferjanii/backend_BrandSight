const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth'); // Check local import

// GET Profile
router.get('/', auth, async (req, res) => {
    try {
        // req.user is already populated by the auth middleware via Appwrite
        res.json(req.user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// UPDATE Profile
router.put('/', auth, async (req, res) => {
    const { name, email, password } = req.body;
    const { users } = require('../services/appwriteService');

    try {
        // Update Name
        if (name) {
            await users.updateName(req.user.id, name);
        }
        
        // Update Email
        if (email) {
            await users.updateEmail(req.user.id, email);
        }

        // Update Password
        if (password) {
            await users.updatePassword(req.user.id, password);
        }

        // Fetch updated user to return
        const updatedUser = await users.get(req.user.id);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.$id,
                name: updatedUser.name,
                email: updatedUser.email,
                ...updatedUser
            }
        });
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ error: err.message || 'Server Error' });
    }
});

module.exports = router;
