const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Basic URL validation
                return /^https?:\/\/.+/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'general',
        trim: true
    },
    scrapeFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'on-demand'],
        default: 'on-demand'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastScraped: {
        type: Date,
        default: null
    },
    scrapedData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Website', websiteSchema);
