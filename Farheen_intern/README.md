# Kanban Board App

A collaborative Kanban board application with authentication, workspaces, tasks, dashboards, and responsive board views.

## Features
- User registration and login
- Workspace creation and join flow
- Task creation, editing, deletion, and status updates
- Kanban board with columns for To Do, In Progress, Review, and Done
- Dashboard summaries for total tasks, my tasks, overdue items, priority distribution, and task status
- REST API with health checks and validation

## Tech Stack
- Frontend: React + Vite + Tailwind-style UI
- Backend: Node.js + Express + MongoDB + Mongoose
- Auth: JWT

## Project Structure
- backend/: Express API and MongoDB models/routes/controllers
- frontend/: React/Vite client

## Local Development
### 1. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables
Copy the example environment file and update the values:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Start the app
```bash
cd backend && npm run dev
```

In a second terminal:
```bash
cd frontend && npm run dev
```

The API will run at http://localhost:5000 and the frontend at http://localhost:5173.

## API Reference
- Swagger spec: [backend/docs/swagger.yaml](backend/docs/swagger.yaml)
- Postman collection: [backend/docs/kanban-api.postman_collection.json](backend/docs/kanban-api.postman_collection.json)

## Deployment Guide
See [backend/docs/deployment.md](backend/docs/deployment.md) for MongoDB Atlas, Render, and Vercel instructions.

## ER Diagram
See [backend/docs/er-diagram.mmd](backend/docs/er-diagram.mmd) for the Mermaid entity relationship diagram.
