# Task Management System

Monolitic system, with frontend written in react and backend in node. User needs to get register first, then user can login. First page will show all task with fitering option. User can go on profile, where a statistics and userId will be shown. User can create task and when clicked on any task, task details will be shown. User can comment and sttached file. 

Please note, since file upload is happening in s3, credentials are needed. without it, file upload will not happen.

## Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- MySQL
- Redis
- AWS S3
- JWT Authentication
- Swagger

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios

### Infrastructure
- Docker (MySQL, Redis)

## Features

- User Authentication (Register, Login)
- Task Management (CRUD operations)
- Comments on Tasks (CRUD operations)
- File Attachments (S3 integration) (CRUD operations)

## Quick Start

Install Node, Docker desktop and npm

### 1. Start Docker Services

```bash
docker-compose up -d
```

### 2. Setup Backend

```bash
npm install
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **API Docs (Swagger)**: http://localhost:3000/api-docs


---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=task_management_system

# JWT
JWT_SECRET=your-secret-key-here

# Redis
REDIS_URL=redis://localhost:6379

# AWS S3 (optional, for file uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket
```

---

## Project Structure

```
├── frontend/          # React frontend application
├── src/               # Backend source code
│   ├── controllers/   # Request handlers
│   ├── repositories/  # Database layer
│   ├── models/       # Business logic
│   ├── routes/       # API routes
│   └── middleware/   # Express middleware
├── docker-compose.yml # Docker services configuration
└── package.json      # Backend dependencies
```
