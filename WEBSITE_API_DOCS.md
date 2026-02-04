# Website Scraping API Documentation

This API provides CRUD operations and automated scraping using Python (Automation & Selenium).

## Base URL
```
http://localhost:3000/api/websites
```

## Website Model Schema
```javascript
{
  name: String,
  url: String,
  description: String,
  category: String,
  scrapeFrequency: String,
  isActive: Boolean,
  lastScraped: Date,
  scrapedData: {
    title: String,
    metaDescription: String,
    h1: [String],
    linksCount: Number,
    imagesCount: Number,
    method: String, // 'static/automation' or 'selenium'
    timestamp: String
  },
  metadata: Object
}
```

---

## Endpoints

### 1. POST - Create Website
`POST /api/websites`

### 2. GET - List Websites
`GET /api/websites` (Supports pagination/filtering)

### 3. GET - Single Website
`GET /api/websites/:id`

### 4. PUT - Update Website
`PUT /api/websites/:id`

### 5. POST - Trigger Python Scraper
**Endpoint:** `POST /api/websites/:id/scrape-trigger`
**Request Body:**
```json
{
  "mode": "static" | "selenium"
}
```
- `static`: Uses Requests + BeautifulSoup (Fast automation).
- `selenium`: Uses Selenium + Chrome (Handles dynamic content).

### 6. DELETE - Delete Website
`DELETE /api/websites/:id`

---

## Python Scraper Details
The system uses a Python script (`python_scraper/scraper.py`) which:
1. Connects to MongoDB.
2. Performs scraping based on the requested mode.
3. Automatically updates the database record.
4. Returns result JSON to the Express server.
