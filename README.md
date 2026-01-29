# Express REST API - Backend Only

A backend-only Express.js REST API with user authentication using JWT tokens and MongoDB.

## Features

- ✅ User Registration
- ✅ User Login with JWT Authentication
- ✅ Password Hashing with bcrypt
- ✅ MongoDB Database with Mongoose
- ✅ Input Validation
- ✅ CORS Support
- ✅ Pure REST API (No Frontend)

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (via Mongoose)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **body-parser** - Request body parsing

## Installation

1. Make sure you have Node.js installed
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Server

Start the server with:
```bash
npm start
```

The API will be available at: `http://localhost:3000`

## API Endpoints

### GET `/`
Get API information and available endpoints.

**Response:**
```json
{
  "message": "Express REST API",
  "version": "1.0.0",
  "endpoints": {
    "register": "POST /api/auth/register",
    "login": "POST /api/auth/login"
  }
}
```

### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
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

### POST `/api/auth/login`
Login with existing credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
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

## Testing the API

### Option 1: PowerShell (Quick Test)
```powershell
# Get API info
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

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
```

### Option 2: REST Client Extension (VS Code)
1. Install the "REST Client" extension in VS Code
2. Open the `api-test.http` file
3. Click "Send Request" above any request

### Option 3: Postman
1. Download and install Postman
2. Import the requests from `API_TESTING.md`
3. Send requests and view responses

### Option 4: curl
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Project Structure

```
express-demo/
├── index.js                 # Main server file
├── database.js              # MongoDB connection
├── package.json             # Dependencies
├── models/
│   └── User.js             # User model (Mongoose schema)
├── routes/
│   └── auth.js             # Authentication routes
├── middleware/
│   └── validation.js       # Input validation middleware
├── data/                   # MongoDB data directory
├── API_TESTING.md          # Detailed API testing guide
├── api-test.http           # REST Client test file
└── README.md               # This file
```

## Security Notes

⚠️ **Important for Production:**
1. Change the `SECRET_KEY` in `routes/auth.js` to a secure random string
2. Use environment variables for sensitive data
3. Enable HTTPS
4. Implement rate limiting
5. Add proper error handling and logging
6. Use a production MongoDB instance (not local)

## Documentation

- **API_TESTING.md** - Comprehensive testing guide with examples
- **api-test.http** - Ready-to-use REST Client test file

## License

ISC
