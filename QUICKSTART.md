# Website Scraping API - Quick Start Guide

## Overview
This guide will help you quickly set up and test the Website CRUD API for the BrandSight scraping system.

## Prerequisites
- Node.js installed
- MongoDB installed and running on `mongodb://127.0.0.1:27017`

## Setup

### 1. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or start manually
mongod
```

### 2. Start the Express Server
```bash
cd c:\Users\hp\BrandSight\express-demo
npm start
```

You should see:
```
Connected to MongoDB database.
REST API Server running on http://localhost:3000
API Documentation: http://localhost:3000/
```

### 3. Verify the Server
Open your browser and navigate to:
```
http://localhost:3000
```

You should see the API documentation with all available endpoints.

## Quick Test

### Using cURL (Command Line)

**1. Create a website:**
```bash
curl -X POST http://localhost:3000/api/websites -H "Content-Type: application/json" -d "{\"name\":\"Google\",\"url\":\"https://www.google.com\",\"category\":\"search\",\"scrapeFrequency\":\"daily\"}"
```

**2. Get all websites:**
```bash
curl http://localhost:3000/api/websites
```

**3. Get a specific website (replace ID):**
```bash
curl http://localhost:3000/api/websites/YOUR_WEBSITE_ID
```

**4. Update a website (replace ID):**
```bash
curl -X PUT http://localhost:3000/api/websites/YOUR_WEBSITE_ID -H "Content-Type: application/json" -d "{\"description\":\"Updated description\"}"
```

**5. Delete a website (replace ID):**
```bash
curl -X DELETE http://localhost:3000/api/websites/YOUR_WEBSITE_ID
```

### Using VS Code REST Client

1. Install the "REST Client" extension in VS Code
2. Open `website-api-test.http`
3. Click "Send Request" above any request to test it

### Using Postman

1. Import the requests from `website-api-test.http`
2. Or manually create requests using the examples in `WEBSITE_API_DOCS.md`

## Example Workflow

### 1. Create Multiple Websites for Scraping

```bash
# Create Google
curl -X POST http://localhost:3000/api/websites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google",
    "url": "https://www.google.com",
    "category": "search",
    "scrapeFrequency": "daily",
    "isActive": true
  }'

# Create GitHub
curl -X POST http://localhost:3000/api/websites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub",
    "url": "https://github.com",
    "category": "development",
    "scrapeFrequency": "weekly",
    "isActive": true
  }'

# Create Amazon
curl -X POST http://localhost:3000/api/websites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amazon",
    "url": "https://www.amazon.com",
    "category": "e-commerce",
    "scrapeFrequency": "daily",
    "isActive": true
  }'
```

### 2. List All Websites

```bash
curl http://localhost:3000/api/websites
```

### 3. Filter Active Websites

```bash
curl "http://localhost:3000/api/websites?isActive=true"
```

### 4. Get Websites by Category

```bash
curl "http://localhost:3000/api/websites?category=search"
```

### 5. Update Scrape Data (After Scraping)

```bash
curl -X PATCH http://localhost:3000/api/websites/YOUR_WEBSITE_ID/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "scrapedData": {
      "title": "Google",
      "metaDescription": "Search the world information",
      "links": 150,
      "images": 20,
      "scrapedAt": "2026-02-04T18:00:00Z"
    }
  }'
```

### 6. Deactivate a Website

```bash
curl -X PUT http://localhost:3000/api/websites/YOUR_WEBSITE_ID \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

## Common Use Cases

### Scraping Workflow

1. **Get all active websites that need scraping:**
   ```bash
   curl "http://localhost:3000/api/websites?isActive=true&scrapeFrequency=daily"
   ```

2. **For each website, perform scraping (external process)**

3. **Update the scraped data:**
   ```bash
   curl -X PATCH http://localhost:3000/api/websites/WEBSITE_ID/scrape \
     -H "Content-Type: application/json" \
     -d '{"scrapedData": {...}}'
   ```

### Managing Websites

1. **Add new websites to monitor:**
   ```bash
   curl -X POST http://localhost:3000/api/websites \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

2. **View all websites with pagination:**
   ```bash
   curl "http://localhost:3000/api/websites?page=1&limit=10&sortBy=name&sortOrder=asc"
   ```

3. **Update website configuration:**
   ```bash
   curl -X PUT http://localhost:3000/api/websites/WEBSITE_ID \
     -H "Content-Type: application/json" \
     -d '{"scrapeFrequency": "weekly"}'
   ```

4. **Remove outdated websites:**
   ```bash
   curl -X DELETE http://localhost:3000/api/websites/WEBSITE_ID
   ```

## Troubleshooting

### MongoDB Connection Error
```
Error: Could not connect to MongoDB
```
**Solution:** Make sure MongoDB is running:
```bash
net start MongoDB
# or
mongod
```

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution:** Change the port in `index.js` or stop the process using port 3000

### URL Validation Error
```
Error: URL is not valid
```
**Solution:** Ensure URLs start with `http://` or `https://`

### Duplicate URL Error
```
Error: A website with this URL already exists
```
**Solution:** Each URL must be unique. Update the existing website instead or use a different URL

## Next Steps

1. **Integrate with a web scraper** (e.g., Puppeteer, Cheerio, Playwright)
2. **Add authentication** to protect your API endpoints
3. **Set up scheduled jobs** to automatically scrape websites based on `scrapeFrequency`
4. **Create a frontend dashboard** to manage websites visually
5. **Add more fields** to the Website model as needed for your scraping requirements

## Additional Resources

- Full API Documentation: `WEBSITE_API_DOCS.md`
- Test File: `website-api-test.http`
- MongoDB Documentation: https://docs.mongodb.com/
- Express.js Documentation: https://expressjs.com/

## Support

For issues or questions, refer to:
- API Documentation: `WEBSITE_API_DOCS.md`
- Test Examples: `website-api-test.http`
