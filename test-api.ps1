# Test Website API Endpoints
# Make sure the server is running: npm start

Write-Host "=== Testing Website CRUD API ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get API Info
Write-Host "1. Getting API Info..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/" -Method GET
    Write-Host "Server is running!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Server is not running or not accessible" -ForegroundColor Red
    exit 1
}

Write-Host "`n---`n"

# Test 2: Create a Website
Write-Host "2. Creating a new website (Google)..." -ForegroundColor Yellow
$body = @{
    name = "Google"
    url = "https://www.google.com"
    description = "Search engine website"
    category = "search"
    scrapeFrequency = "daily"
    isActive = $true
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/websites" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Website created successfully!" -ForegroundColor Green
    $websiteId = $createResponse.website._id
    Write-Host "Website ID: $websiteId" -ForegroundColor Cyan
    $createResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Failed to create website" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 3: Get All Websites
Write-Host "3. Getting all websites..." -ForegroundColor Yellow
try {
    $allWebsites = Invoke-RestMethod -Uri "http://localhost:3000/api/websites" -Method GET
    Write-Host "Retrieved websites successfully!" -ForegroundColor Green
    Write-Host "Total websites: $($allWebsites.pagination.total)" -ForegroundColor Cyan
    $allWebsites | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Failed to get websites" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 4: Create Another Website
Write-Host "4. Creating another website (GitHub)..." -ForegroundColor Yellow
$body2 = @{
    name = "GitHub"
    url = "https://github.com"
    description = "Code hosting platform"
    category = "development"
    scrapeFrequency = "weekly"
    isActive = $true
} | ConvertTo-Json

try {
    $createResponse2 = Invoke-RestMethod -Uri "http://localhost:3000/api/websites" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "Website created successfully!" -ForegroundColor Green
    $websiteId2 = $createResponse2.website._id
    Write-Host "Website ID: $websiteId2" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to create website (might already exist)" -ForegroundColor Yellow
}

Write-Host "`n---`n"

# Test 5: Get Website by ID (if we have one)
if ($websiteId) {
    Write-Host "5. Getting website by ID..." -ForegroundColor Yellow
    try {
        $singleWebsite = Invoke-RestMethod -Uri "http://localhost:3000/api/websites/$websiteId" -Method GET
        Write-Host "Retrieved website successfully!" -ForegroundColor Green
        $singleWebsite | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "Failed to get website by ID" -ForegroundColor Red
    }
    
    Write-Host "`n---`n"
}

# Test 6: Update Website (if we have one)
if ($websiteId) {
    Write-Host "6. Updating website..." -ForegroundColor Yellow
    $updateBody = @{
        description = "Updated: Worlds most popular search engine"
        category = "search-engine"
    } | ConvertTo-Json
    
    try {
        $updateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/websites/$websiteId" -Method PUT -Body $updateBody -ContentType "application/json"
        Write-Host "Website updated successfully!" -ForegroundColor Green
        $updateResponse | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "Failed to update website" -ForegroundColor Red
    }
    
    Write-Host "`n---`n"
}

# Test 7: Update Scrape Data (if we have one)
if ($websiteId) {
    Write-Host "7. Updating scrape data..." -ForegroundColor Yellow
    $scrapeBody = @{
        scrapedData = @{
            title = "Google"
            metaDescription = "Search the worlds information"
            links = 150
            images = 20
            scrapedAt = (Get-Date).ToString("o")
        }
    } | ConvertTo-Json -Depth 3
    
    try {
        $scrapeResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/websites/$websiteId/scrape" -Method PATCH -Body $scrapeBody -ContentType "application/json"
        Write-Host "Scrape data updated successfully!" -ForegroundColor Green
        Write-Host "Last scraped: $($scrapeResponse.website.lastScraped)" -ForegroundColor Cyan
    } catch {
        Write-Host "Failed to update scrape data" -ForegroundColor Red
    }
    
    Write-Host "`n---`n"
}

# Test 8: Filter Websites
Write-Host "8. Filtering websites by category..." -ForegroundColor Yellow
try {
    $filtered = Invoke-RestMethod -Uri "http://localhost:3000/api/websites?category=search" -Method GET
    Write-Host "Filtered websites successfully!" -ForegroundColor Green
    Write-Host "Found $($filtered.websites.Count) website(s) in search category" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to filter websites" -ForegroundColor Red
}

Write-Host "`n---`n"

Write-Host "=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Websites were created but NOT deleted. You can:" -ForegroundColor Yellow
Write-Host "- View them at: http://localhost:3000/api/websites" -ForegroundColor White
Write-Host "- Delete manually using the API or MongoDB" -ForegroundColor White
