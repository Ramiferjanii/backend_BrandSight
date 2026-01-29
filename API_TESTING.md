# API Testing Guide

This document provides examples for testing the Express REST API without a frontend.

## Base URL
```
http://localhost:3000
```

## Available Endpoints

### 1. API Info
**GET** `/`

Get information about available endpoints.

**Example using curl:**
```bash
curl http://localhost:3000/
```

**Example using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get
```

---

### 2. Register User
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

**Example using PowerShell:**
```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Email already exists"
}
```

---

### 3. Login User
**POST** `/api/auth/login`

Login with existing credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

**Example using PowerShell:**
```powershell
$body = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid email or password"
}
```

---

## Testing Tools

### 1. **PowerShell (Built-in)**
Use the examples above with `Invoke-RestMethod` or `Invoke-WebRequest`.

### 2. **curl (Command Line)**
Download from: https://curl.se/windows/
Use the curl examples above.

### 3. **Postman (GUI)**
Download from: https://www.postman.com/downloads/
- Create a new request
- Set method (GET/POST)
- Enter URL
- Add JSON body for POST requests
- Click Send

### 4. **Thunder Client (VS Code Extension)**
Install from VS Code Extensions:
- Search for "Thunder Client"
- Install the extension
- Use the Thunder Client sidebar to make requests

### 5. **REST Client (VS Code Extension)**
Install from VS Code Extensions:
- Search for "REST Client"
- Create a `.http` file (see below)

---

## REST Client File (.http)

Create a file named `api-test.http` and use it with the REST Client extension:

```http
### Get API Info
GET http://localhost:3000/

### Register New User
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

### Login User
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

---

## Quick Start Testing

1. **Start the server:**
   ```bash
   node index.js
   ```

2. **Test with PowerShell:**
   ```powershell
   # Test API Info
   Invoke-RestMethod -Uri "http://localhost:3000/"
   
   # Register a user
   $registerBody = @{
       name = "Test User"
       email = "test@example.com"
       password = "test123"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
   
   # Login
   $loginBody = @{
       email = "test@example.com"
       password = "test123"
   } | ConvertTo-Json
   
   $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
   
   # Display the token
   Write-Host "Token: $($response.token)"
   ```

---

## Notes

- The JWT token expires in 1 hour
- Remember to change the SECRET_KEY in `routes/auth.js` for production
- All responses are in JSON format
- The API includes CORS headers for cross-origin requests
