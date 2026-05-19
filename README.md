# FlowPilot — Backend API

> REST API for FlowPilot, a full-stack team project management application. Built with Node.js, Express, MongoDB, and JWT authentication.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongoosejs.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=flat&logo=railway&logoColor=white)](https://railway.app)

---

## Features

- **JWT Authentication** — Secure signup and login with role-based access
- **Role System** — Admin and Member roles with protected endpoints
- **Admin Secret Key** — Secure admin signup via environment-controlled secret
- **Project Management** — Full CRUD with membership access control
- **Task Management** — Kanban-style tasks with status, priority, and due dates
- **Dashboard Analytics** — Aggregated stats across projects and tasks
- **Profile Management** — Update name, email, and password
- **Admin Controls** — Promote or demote any user by email
- **Production Ready** — CORS config, global error handler, Railway deployment

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js 18+ | Runtime |
| Express 5 | Web framework |
| MongoDB Atlas | Database |
| Mongoose 8 | ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT tokens |
| dotenv | Environment variables |
| cors | Cross-origin requests |
| nodemon | Development server |

---

## Project Structure

```
server/
├── config/
│   └── db.js                   # MongoDB connection
├── controllers/
│   ├── authController.js       # Auth, profile, admin actions
│   ├── projectController.js    # Project CRUD + dashboard stats
│   └── taskController.js       # Task CRUD + recent tasks
├── middleware/
│   └── authMiddleware.js       # JWT protect + adminOnly guards
├── models/
│   ├── User.js                 # name, email, password, role
│   ├── Project.js              # title, description, status, progress, members
│   └── Task.js                 # title, status, priority, dueDate, assignee
├── routes/
│   ├── authRoutes.js           # /api/auth/*
│   ├── projectRoutes.js        # /api/projects/*
│   └── taskRoutes.js           # /api/tasks/*
├── scripts/
│   └── createAdmin.js          # One-time admin seed script
├── utils/
│   └── generateToken.js        # JWT token helper
├── .env.example                # Environment variable template
├── railway.toml                # Railway deployment config
└── server.js                   # App entry point
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register as member or admin |
| POST | `/login` | Public | Login and receive JWT token |
| GET | `/me` | Protected | Get current user profile |
| PUT | `/profile` | Protected | Update name and email |
| PUT | `/password` | Protected | Change password |
| PUT | `/promote` | Admin only | Promote or demote any user |

### Projects — `/api/projects`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Protected | Get all user's projects |
| POST | `/` | Protected | Create a new project |
| GET | `/stats` | Protected | Dashboard analytics |
| GET | `/:id` | Protected | Get single project |
| PUT | `/:id` | Owner / Admin | Update project |
| DELETE | `/:id` | Owner / Admin | Delete project |

### Tasks — `/api/tasks`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/?project=<id>` | Protected | Get tasks for a project |
| GET | `/recent` | Protected | Last 6 tasks across all projects |
| POST | `/` | Protected | Create a task |
| PUT | `/:id` | Member / Admin | Update task |
| DELETE | `/:id` | Creator / Admin | Delete task |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/flowpilot-server.git
cd flowpilot-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### Environment Variables

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/flowpilot
JWT_SECRET=your-long-random-secret-key
CLIENT_URL=http://localhost:5173
ADMIN_SECRET_KEY=your-admin-signup-key
```

### Create First Admin

```bash
# Edit scripts/createAdmin.js with your email and password first
npm run create-admin
```

---

## Deployment — Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select this repository
4. Add environment variables in the Variables tab:

```
MONGO_URI         = your MongoDB Atlas URI
JWT_SECRET        = your JWT secret
ADMIN_SECRET_KEY  = your admin signup key
CLIENT_URL        = https://your-frontend.railway.app
```

5. Go to Settings → Networking → Generate Domain

---

## Role-Based Access

| Action | Member | Admin |
|---|---|---|
| View own projects | ✅ | ✅ all |
| Create project | ✅ | ✅ |
| Edit / delete own project | ✅ | ✅ |
| Edit / delete any project | ❌ | ✅ |
| Create / edit tasks | ✅ | ✅ |
| Delete own tasks | ✅ | ✅ |
| Delete any task | ❌ | ✅ |
| Promote / demote users | ❌ | ✅ |

---

## Admin Signup Flow

All users sign up as **member** by default. To sign up as admin:

1. The person signing up selects **Admin** role on the signup page
2. They enter the `ADMIN_SECRET_KEY` set in your `.env`
3. Backend validates the key — correct key creates an admin account
4. Wrong key returns `401 Invalid admin secret key`

You control the key — share it only with trusted team members.

---

## Related

- [FlowPilot Frontend](https://github.com/YOUR_USERNAME/flowpilot-client) — React app

---

## License

MIT
