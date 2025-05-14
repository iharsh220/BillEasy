# Secure File Upload & Metadata Processing Microservice

A Node.js backend microservice that handles authenticated file uploads, stores associated metadata in a database, and processes those files asynchronously.

## Features

- User authentication with JWT
- Secure file upload with size limits and file type validation
- Background processing of uploaded files
- Advanced file metadata extraction
- File compression with gzip
- User-based access control
- Pagination for file listing
- Rate limiting for API endpoints
- Comprehensive logging
- Robust error handling
- Docker support

## Tech Stack

- **Node.js** (v18+)
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM
- **BullMQ** - Background job processing
- **Redis** - Queue storage
- **Multer** - File upload handling
- **JWT** - Authentication
- **Express Rate Limit** - API rate limiting
- **Compression** - Response compression
- **Helmet** - Security headers
- **Docker** - Containerization

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis
- Docker (optional)

## Installation

### Option 1: Local Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=3000

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=file_upload_service
   DB_USER=postgres
   DB_PASSWORD=postgres

   # JWT
   JWT_SECRET=jwt_secret_key
   JWT_EXPIRES_IN=1d

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # File Upload
   MAX_FILE_SIZE=10737418240  # 10GB in bytes
   UPLOAD_PATH=./uploads
   ```

4. Create the database:
   ```
   createdb file_upload_service
   ```

5. Run migrations and seed the database:
   ```
   npm run db:migrate
   npm run db:seed
   ```

6. Start the server:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

### Option 2: Docker Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Start the containers:
   ```
   docker-compose up -d
   ```

   This will start the Node.js application, PostgreSQL, and Redis containers.

## API Documentation

### Authentication

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "jwt_token_here",
      "user": {
        "id": 1,
        "email": "user@example.com"
      }
    }
  }
  ```

### File Operations

#### Upload File
- **URL**: `/api/upload`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Body**: Form Data
  - `file`: File to upload
  - `title` (optional): File title
  - `description` (optional): File description
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "File uploaded successfully",
    "data": {
      "fileId": 1,
      "status": "uploaded"
    }
  }
  ```

#### Get File by ID
- **URL**: `/api/files/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **URL Params**: `id=[integer]`
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "originalFilename": "example.pdf",
      "title": "Example Document",
      "description": "This is an example document",
      "status": "processed",
      "extractedData": "{\"hash\":\"...\",\"size\":12345,\"mimeType\":\"pdf\",\"processedAt\":\"2023-05-14T12:34:56.789Z\"}",
      "uploadedAt": "2023-05-14T12:30:00.000Z",
      "jobs": [
        {
          "id": 1,
          "status": "completed",
          "errorMessage": null,
          "startedAt": "2023-05-14T12:31:00.000Z",
          "completedAt": "2023-05-14T12:34:56.789Z"
        }
      ]
    }
  }
  ```

#### Get All Files
- **URL**: `/api/files`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Query Params**:
  - `page=[integer]` (optional, default: 1)
  - `limit=[integer]` (optional, default: 10)
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "files": [
        {
          "id": 2,
          "originalFilename": "example2.pdf",
          "title": "Example Document 2",
          "description": "This is another example document",
          "status": "processed",
          "uploadedAt": "2023-05-14T13:30:00.000Z"
        },
        {
          "id": 1,
          "originalFilename": "example.pdf",
          "title": "Example Document",
          "description": "This is an example document",
          "status": "processed",
          "uploadedAt": "2023-05-14T12:30:00.000Z"
        }
      ],
      "pagination": {
        "totalItems": 2,
        "totalPages": 1,
        "currentPage": 1,
        "itemsPerPage": 10
      }
    }
  }
  ```

## Design Choices

1. **Authentication**: JWT-based authentication was chosen for its stateless nature and ease of implementation.

2. **File Storage**: Files are stored on the local filesystem with user-specific directories for isolation.

3. **Background Processing**: BullMQ with Redis was used for reliable asynchronous processing with retry capabilities.

4. **Database Schema**: Sequelize ORM with PostgreSQL provides a robust and scalable data storage solution.

5. **File Compression**: Files are compressed using gzip to reduce storage requirements and improve transfer speeds.

6. **Security Measures**:
   - JWT authentication for all endpoints
   - File size limits up to 10GB
   - File type validation to prevent malicious uploads
   - Rate limiting to prevent abuse and DoS attacks
   - User-based access control for files
   - Secure file storage with user isolation
   - Input validation
   - Security headers with Helmet

7. **Logging**: Comprehensive logging system for debugging and monitoring.

8. **Error Handling**: Centralized error handling with custom error classes for consistent API responses.

## Limitations and Assumptions

1. **File Storage**: Files are stored locally, which is not suitable for a distributed system. In a production environment, a cloud storage solution like AWS S3 would be more appropriate.

2. **Authentication**: For simplicity, the authentication system uses a basic email/password approach. In a production environment, more robust authentication methods should be considered.

3. **Scalability**: The current implementation is designed to run as a single instance. For horizontal scaling, additional considerations would be needed.

4. **File Processing**: While the file processing includes compression and metadata extraction, in a real-world scenario, more complex processing would likely be required (e.g., virus scanning, content analysis).

5. **Rate Limiting**: The rate limiting is based on simple counters. In a production environment, a more sophisticated rate limiting strategy might be needed.

6. **Logging**: Logs are written to files. In a production environment, a centralized logging system would be more appropriate.

## Postman Collection

A Postman collection is included in the repository (`postman_collection.json`) for testing the API. To use it:

1. Import the collection into Postman
2. Set up an environment with the following variables:
   - `baseUrl`: The base URL of the API (e.g., `http://localhost:3000`)
   - `token`: Will be automatically set after login
   - `fileId`: Will be automatically set after file upload

3. Run the requests in the following order:
   - Login (to get the JWT token)
   - Upload File
   - Get File by ID
   - Get All Files

## License

[MIT](LICENSE)
