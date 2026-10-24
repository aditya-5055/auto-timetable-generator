# Automatic Timetable Generator

An automated timetable scheduling and management system with a modern React frontend and Node.js / Express / Sequelize backend.

## 🚀 Features

- **Automated Scheduling**: Intelligent generation and management of institutional timetables.
- **User Authentication**: Secure JWT-based authentication with role-based routing.
- **Modern Responsive UI**: Built with React 19, Tailwind CSS, Lucide icons, and Vite.
- **Robust REST API**: Node.js & Express server connected to MySQL via Sequelize ORM.
- **Database Utilities**: Pre-configured scripts for database synchronization and seeding.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Axios, React Router DOM
- **Backend**: Node.js, Express.js, Sequelize ORM, MySQL2, JWT, bcryptjs
- **Tooling**: Concurrently for running full-stack development concurrently

---

## 📁 Project Structure

```text
├── backend/            # Express REST API & Sequelize models
│   ├── src/
│   │   ├── config/     # Database and synchronization configs
│   │   ├── controllers/# Request handlers
│   │   ├── models/     # Sequelize data models
│   │   ├── routes/     # Express route definitions
│   │   └── index.js    # Entry point
│   ├── .env.example    # Environment variable template
│   └── package.json
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application views
│   │   └── App.jsx
│   └── package.json
├── package.json        # Root scripts to run both frontend & backend
└── README.md
```

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- MySQL Database

### 2. Installation
Install all dependencies for root, backend, and frontend with a single command:
```bash
npm run install:all
```

### 3. Environment Configuration
Create a `.env` file in the `backend/` directory based on `backend/.env.example`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=timetable_db
```

### 4. Database Setup
Synchronize and seed the database:
```bash
npm run db:sync
npm run db:seed
```

### 5. Running the Application
Start both the backend server and frontend development server simultaneously:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
