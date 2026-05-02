# 🚀 TaskFlow - Team Task Manager


## 📺 Video Demonstration

Watch the full video explanation of the project:
**[View on Loom](https://www.loom.com/share/63149076c3fd4670944b0286d1af407f)**

---

A high-performance, full-stack team task management application built with the MERN stack. TaskFlow provides a seamless experience for managing projects, tracking tasks, and collaborating with team members in real-time.

---

## ✨ Key Features

- **🔐 Robust Authentication:** Secure login and signup using JWT (JSON Web Tokens) with refresh token logic.
- **🛡️ Role-Based Access Control (RBAC):** 
  - **Admin:** Global access to all projects and tasks.
  - **Member:** Restricted access to projects where they are specifically assigned.
- **📊 Interactive Dashboard:** Overview of project progress, task distributions, and team activity.
- **📋 Task Management:** Create, update, and track tasks with status, priority, and due dates.
- **🏗️ Project Organization:** Group tasks into projects with dedicated member assignments.
- **🎨 Modern UI/UX:** Built with Tailwind CSS and shadcn/ui for a premium, responsive look and feel.
- **⚡ Performance First:** Optimized with React Query for efficient data fetching and caching.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** React Query + Context API
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (via Mongoose)
- **Security:** Helmet, Bcryptjs, Express Rate Limit
- **Validation:** Express Validator

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Team-Task-Manager
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Seed the Database (Optional but Recommended):**
   ```bash
   cd backend
   node seed.js
   ```

2. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend Server:**
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🧪 Test Credentials

If you used the seed script, you can log in with the following credentials (all use password: `password123`):

| Role | Email | Access Level |
| :--- | :--- | :--- |
| **Admin** | `admin@taskflow.com` | Global access to all projects |
| **Member** | `jordan@taskflow.com` | Assigned Projects only |
| **Member** | `priya@taskflow.com` | Assigned Projects only |
| **Member** | `rahul@taskflow.com` | Assigned Projects only |

---

## 📸 Screenshots

*(Add screenshots here after deploying or running locally)*

---

## 📝 License

This project is licensed under the MIT License.
