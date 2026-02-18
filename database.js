const mongoose = require('mongoose');

const DBSOURCE = "mongodb://127.0.0.1:27018/express-demo";

mongoose.connect(DBSOURCE, {
    // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+ 
    // but useful to keep in mind for older versions or explicit configuration if needed.
    // For Mongoose 8.x (latest at 2024/2026), connection is simpler.
})
    .then(() => {
        console.log('Connected to MongoDB database.');
    })
    .catch((err) => {
        console.error('Could not connect to MongoDB:', err.message);
    });

module.exports = mongoose.connection;
