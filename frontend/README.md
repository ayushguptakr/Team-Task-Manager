# Team Task Manager

A full-stack team task management application built with React, Express, and MongoDB.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT Auth
- **Database:** MongoDB Atlas

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Backend Setup
```bash
cd backend
npm install
node seed.js        # Seed the database with sample data
npm start           # or: node index.js
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend (`backend/.env`):**
```
PORT=5000
CLIENT_URL=http://localhost:8081
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
```

**Frontend (`frontend/.env`):**
```
VITE_API_URL=http://localhost:5000/api
```

## Test Credentials

All accounts use the password: `password123`

| Role   | Email                  | Can See                          |
|--------|------------------------|----------------------------------|
| Admin  | admin@taskflow.com     | ALL 3 projects (global access)   |
| Member | jordan@taskflow.com    | Website Redesign, API Integration Suite |
| Member | priya@taskflow.com     | Website Redesign, Mobile App MVP |
| Member | rahul@taskflow.com     | Mobile App MVP, API Integration Suite |

## RBAC (Role-Based Access Control)

- **Admin** can view, create, edit, and delete all projects and tasks globally — without needing to be added as a member.
- **Members** can only see projects where they are explicitly added to the `members` array.

## Seed Data Structure

- **4 Users:** 1 Admin + 3 Members
- **3 Projects:**
  - Website Redesign → Jordan + Priya
  - Mobile App MVP → Priya + Rahul
  - API Integration Suite → Jordan + Rahul
- **14 Tasks** distributed across all 3 projects with varied statuses and priorities.
