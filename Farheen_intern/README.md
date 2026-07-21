# Collaborative Kanban Board

A full-stack collaborative Kanban Board application that enables teams to manage projects efficiently through workspaces, task boards, real-time notifications, comments, file attachments, and role-based access control.

---

## 🚀 Features

- User Registration & Login (JWT Authentication)
- Secure Protected Routes
- Workspace Creation & Management
- Invite Members to Workspaces
- Kanban Board with Drag & Drop
- Task CRUD Operations
- Task Assignment & Priority Management
- Comments with @Mention Notifications
- File Attachments
- Dashboard Analytics
- Real-time Notifications using Socket.IO
- Activity Tracking
- Role-Based Access Control (RBAC)
- RESTful APIs
- Swagger API Documentation

---

# 🛠 Technology Stack

## Frontend

- React.js
- Vite
- React Router
- Axios
- Tailwind CSS

## Backend

- Node.js
- Express.js
- Socket.IO
- Multer
- JWT Authentication
- bcrypt.js
- Express Validator
- Helmet
- CORS

## Database

- MongoDB
- Mongoose ODM

## Deployment

- Frontend – Vercel
- Backend – Render

---

# 🏗 System Architecture

The application follows a three-tier architecture.

```
React Frontend
       │
       │ REST API + JWT
       ▼
Express.js Backend
       │
       │ Mongoose
       ▼
MongoDB Database
```

### Workflow

1. User logs in using JWT Authentication.
2. Frontend sends authenticated requests to Express APIs.
3. Express validates the token.
4. Controllers process requests.
5. MongoDB stores and retrieves data.
6. Socket.IO broadcasts real-time notifications.
7. React updates the user interface instantly.

---

# 📂 Project Structure

```
project-root
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.js
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── utils
│   │   └── server.js
│   │
│   ├── uploads
│   └── package.json
│
└── README.md
```

---

# ⚙ Installation & Setup

## Clone Repository

```bash
git clone https://github.com/Farheen-Banu26/kanban_internship.git
```

```bash
cd kanban_internship
```

---

## Backend Setup

```bash
cd backend
```

Install dependencies

```bash
npm install
```


```

Start backend

```bash
npm run dev
```

Backend runs on

```
http://localhost:5000
```

---

## Frontend Setup

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Create `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend

```bash
npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# 📡 API Documentation

Swagger Documentation

```
/api-docs
```

Main API Modules

- Authentication
- Workspaces
- Tasks
- Comments
- Attachments
- Dashboard
- Notifications
- Invitations
- Users

---

# 🔐 Security Features

- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes
- Role-Based Access Control
- Helmet Security Middleware
- Express Validator
- CORS Protection
- Rate Limiting

---

# 📊 Database Collections

- Users
- Workspaces
- Tasks
- Notifications
- Invitations
- Activities

---

# 🚀 Deployment

### Frontend

https://kanban-internship-seven.vercel.app

### Backend

https://kanban-internship-8vjw.onrender.com

## API Reference
- Swagger spec: [backend/docs/swagger.yaml](backend/docs/swagger.yaml)
- Postman collection: [backend/docs/kanban-api.postman_collection.json](backend/docs/kanban-api.postman_collection.json)

## Deployment Guide
See [backend/docs/deployment.md](backend/docs/deployment.md) for MongoDB Atlas, Render, and Vercel instructions.

## ER Diagram
See [backend/docs/er-diagram.mmd](backend/docs/er-diagram.mmd) for the Mermaid entity relationship diagram.

The API will run at http://localhost:5000 and the frontend at http://localhost:5173.


---

# 📈 Project Highlights

- 100% Functional Full Stack Application
- Modern Responsive UI
- Real-time Collaboration
- Drag & Drop Kanban Board
- Dashboard Analytics
- Secure REST APIs
- Cloud Deployment
- Production Ready Architecture

---


# 👩‍💻 Developed By

**Farheen Banu S D**
