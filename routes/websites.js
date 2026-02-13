const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const { scrapeWebsiteTask } = require('../services/scraperService');

// CREATE: Add a new website to the database
router.post('/', async (req, res) => {
    try {
        const { name, url, description, category, scrapeFrequency, isActive, metadata } = req.body;

        // Validate required fields
        if (!name || !url) {
            return res.status(400).json({
                error: 'Name and URL are required fields'
            });
        }

        // Check if website with this URL already exists
        const existingWebsite = await Website.findOne({ url });
        if (existingWebsite) {
            return res.status(409).json({
                error: 'A website with this URL already exists',
                existingWebsite: {
                    id: existingWebsite._id,
                    name: existingWebsite.name,
                    url: existingWebsite.url
                }
            });
        }

        // Create new website
        const website = new Website({
            name,
            url,
            description,
            category,
            scrapeFrequency,
            isActive,
            metadata
        });

        const savedWebsite = await website.save();

        res.status(201).json({
            message: 'Website created successfully',
            website: savedWebsite
        });
    } catch (error) {
        console.error('Error creating website:', error);
        res.status(500).json({
            error: 'Failed to create website',
            details: error.message
        });
    }
});

// READ: Get all websites from the database
router.get('/', async (req, res) => {
    try {
        const {
            category,
            isActive,
            scrapeFrequency,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        if (category) filter.category = category;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (scrapeFrequency) filter.scrapeFrequency = scrapeFrequency;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Get websites with pagination
        const websites = await Website.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Website.countDocuments(filter);

        res.json({
            websites,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching websites:', error);
        res.status(500).json({
            error: 'Failed to fetch websites',
            details: error.message
        });
    }
});

// READ: Get a single website by ID
router.get('/:id', async (req, res) => {
    try {
        const website = await Website.findById(req.params.id);

        if (!website) {
            return res.status(404).json({
                error: 'Website not found'
            });
        }

        res.json({ website });
    } catch (error) {
        console.error('Error fetching website:', error);
        res.status(500).json({
            error: 'Failed to fetch website',
            details: error.message
        });
    }
});

// UPDATE: Update a website in the database
router.put('/:id', async (req, res) => {
    try {
        const { name, url, description, category, scrapeFrequency, isActive, lastScraped, scrapedData, metadata } = req.body;

        // Check if website exists
        const website = await Website.findById(req.params.id);
        if (!website) {
            return res.status(404).json({
                error: 'Website not found'
            });
        }

        // If URL is being changed, check if new URL already exists
        if (url && url !== website.url) {
            const existingWebsite = await Website.findOne({ url });
            if (existingWebsite) {
                return res.status(409).json({
                    error: 'A website with this URL already exists'
                });
            }
        }

        // Update fields
        if (name !== undefined) website.name = name;
        if (url !== undefined) website.url = url;
        if (description !== undefined) website.description = description;
        if (category !== undefined) website.category = category;
        if (scrapeFrequency !== undefined) website.scrapeFrequency = scrapeFrequency;
        if (isActive !== undefined) website.isActive = isActive;
        if (lastScraped !== undefined) website.lastScraped = lastScraped;
        if (scrapedData !== undefined) website.scrapedData = scrapedData;
        if (metadata !== undefined) website.metadata = metadata;

        const updatedWebsite = await website.save();

        res.json({
            message: 'Website updated successfully',
            website: updatedWebsite
        });
    } catch (error) {
        console.error('Error updating website:', error);
        res.status(500).json({
            error: 'Failed to update website',
            details: error.message
        });
    }
});

// PATCH: Partially update a website (for updating scrape data)
router.patch('/:id/scrape', async (req, res) => {
    try {
        const { scrapedData } = req.body;

        const website = await Website.findByIdAndUpdate(
            req.params.id,
            {
                scrapedData,
                lastScraped: new Date(),
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!website) {
            return res.status(404).json({
                error: 'Website not found'
            });
        }

        res.json({
            message: 'Scrape data updated successfully',
            website
        });
    } catch (error) {
        console.error('Error updating scrape data:', error);
        res.status(500).json({
            error: 'Failed to update scrape data',
            details: error.message
        });
    }
});

// DELETE: Delete a website from the database
router.delete('/:id', async (req, res) => {
    try {
        const website = await Website.findByIdAndDelete(req.params.id);

        if (!website) {
            return res.status(404).json({
                error: 'Website not found'
            });
        }

        res.json({
            message: 'Website deleted successfully',
            deletedWebsite: {
                id: website._id,
                name: website.name,
                url: website.url
            }
        });
    } catch (error) {
        console.error('Error deleting website:', error);
        res.status(500).json({
            error: 'Failed to delete website',
            details: error.message
        });
    }
});

// DELETE: Delete multiple websites
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                error: 'Please provide an array of website IDs to delete'
            });
        }

        const result = await Website.deleteMany({ _id: { $in: ids } });

        res.json({
            message: 'Websites deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting websites:', error);
        res.status(500).json({
            error: 'Failed to delete websites',
            details: error.message
        });
    }
});

const { sendEmailNotification, sendWhatsAppNotification } = require('../services/notificationService');

// TRIGGER SCRAPE: Manually start a scrape for a specific website
router.post('/:id/scrape-trigger', async (req, res) => {
    try {
        const websiteId = req.params.id;
        const { mode = 'static', notifyEmail, notifyWhatsApp, emailTo, phoneTo } = req.body;

        // Find website first to ensure it exists
        const website = await Website.findById(websiteId);
        if (!website) {
            return res.status(404).json({ error: 'Website not found' });
        }

        // Start scraping task
        const updatedWebsite = await scrapeWebsiteTask(websiteId, mode);
        const latestData = updatedWebsite.scrapedData;

        // Optional Notifications
        let notificationStatus = { email: 'none', whatsapp: 'none' };

        if (notifyEmail && emailTo) {
            try {
                await sendEmailNotification(emailTo, `Scraping Result: ${website.name}`, {
                    ...latestData,
                    url: updatedWebsite.url,
                    domain: updatedWebsite.url.split('/')[2]
                });
                notificationStatus.email = 'sent';
            } catch (err) {
                notificationStatus.email = 'failed: ' + err.message;
            }
        }

        if (notifyWhatsApp && phoneTo) {
            try {
                await sendWhatsAppNotification(phoneTo, {
                    ...latestData,
                    url: updatedWebsite.url
                });
                notificationStatus.whatsapp = 'sent';
            } catch (err) {
                notificationStatus.whatsapp = 'failed: ' + err.message;
            }
        }

        res.json({
            message: `Scraping (${mode}) completed successfully`,
            notifications: notificationStatus,
            website: updatedWebsite
        });
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({
            error: 'Scraping failed',
            details: error.message
        });
    }
});

module.exports = router;
