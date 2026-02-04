# Test Auth API and Password Validation
# Make sure the server is running: npm run dev

Write-Host "=== Testing Auth API and Password Validation ===" -Color Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/auth"

# Test 1: Too short
Write-Host "Test: Password too short (4 chars)" -Color Yellow
$body = @{ name = "John"; email = "john1@example.com"; password = "Ab1!" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✗ Error: Should have failed" -Color Red
} catch {
    Write-Host "✓ Correctly rejected" -Color Green
}

# Test 2: No Uppercase
Write-Host "Test: Password no uppercase" -Color Yellow
$body = @{ name = "John"; email = "john2@example.com"; password = "password123!" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✗ Error: Should have failed" -Color Red
} catch {
    Write-Host "✓ Correctly rejected" -Color Green
}

# Test 3: No Number
Write-Host "Test: Password no number" -Color Yellow
$body = @{ name = "John"; email = "john3@example.com"; password = "Password!" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✗ Error: Should have failed" -Color Red
} catch {
    Write-Host "✓ Correctly rejected" -Color Green
}

# Test 4: No Special Symbol
Write-Host "Test: Password no special symbol" -Color Yellow
$body = @{ name = "John"; email = "john4@example.com"; password = "Password123" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✗ Error: Should have failed" -Color Red
} catch {
    Write-Host "✓ Correctly rejected" -Color Green
}

# Test 5: Valid Password
Write-Host "Test: Valid password (8+ chars, upper, number, symbol)" -Color Yellow
$email = "test_" + (Get-Random) + "@example.com"
$body = @{ name = "Valid User"; email = "$email"; password = "SecureP@ss123" } | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Success: $($res.message)" -Color Green
} catch {
    Write-Host "✗ Error: Should have succeeded. $($_.Exception.Message)" -Color Red
}

Write-Host "=== Auth Tests Completed ===" -Color Cyan
