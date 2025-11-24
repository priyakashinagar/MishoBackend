# MishoBackend

A simple REST API backend for the Misho application built with Node.js and Express.

## Features

- RESTful API endpoints for CRUD operations
- In-memory data storage
- CORS enabled
- Error handling middleware
- Health check endpoint

## Prerequisites

- Node.js (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/priyakashinagar/MishoBackend.git
cd MishoBackend
```

2. Install dependencies:
```bash
npm install
```

## Usage

Start the server:
```bash
npm start
```

The server will start on port 3000 by default. You can change the port by setting the `PORT` environment variable.

## API Endpoints

### Health Check
- **GET** `/health` - Check if the server is running
  - Response: `{ "status": "ok", "message": "Misho Backend is running" }`

### Items API

- **GET** `/api/items` - Get all items
  - Response: `{ "success": true, "data": [...] }`

- **GET** `/api/items/:id` - Get a specific item by ID
  - Response: `{ "success": true, "data": {...} }`

- **POST** `/api/items` - Create a new item
  - Body: `{ "name": "string", "description": "string" }`
  - Response: `{ "success": true, "data": {...} }`

- **PUT** `/api/items/:id` - Update an existing item
  - Body: `{ "name": "string", "description": "string" }`
  - Response: `{ "success": true, "data": {...} }`

- **DELETE** `/api/items/:id` - Delete an item
  - Response: `{ "success": true, "message": "Item deleted", "data": {...} }`

## Example Usage

```bash
# Health check
curl http://localhost:3000/health

# Create an item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Item", "description": "This is a test"}'

# Get all items
curl http://localhost:3000/api/items

# Get specific item
curl http://localhost:3000/api/items/1

# Update item
curl -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Item", "description": "Updated description"}'

# Delete item
curl -X DELETE http://localhost:3000/api/items/1
```

## License

ISC
