const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import Mongoose Model
const { validateRegister, validateLogin } = require('../middleware/validation.js');

const SECRET_KEY = "your_super_secret_key_change_this_in_production";

router.post('/register', validateRegister, async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ "error": "Email already exists" });
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: hash
        });

        res.status(201).json({
            "message": "User registered successfully",
            "data": {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (err) {
        return res.status(400).json({ "error": err.message });
    }
});

router.post('/login', validateLogin, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ "error": "Invalid email or password" });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ "error": "Invalid email or password" });
        }

        // Use _id for MongoDB documents
        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            "message": "Login successful",
            "token": token,
            "user": {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

module.exports = router;
