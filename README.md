# Invoice & Expense Manager — MERN SaaS Stack

A production-oriented, educational MERN stack web application for small business invoice and expense tracking.

---

## 📁 Project Structure

```
invoice-expense-manager/
├── client/                 # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/     # Modular React components
│   │   ├── pages/          # Application views/routes
│   │   ├── layouts/        # Page layout wrappers (Auth, Dashboard)
│   │   ├── hooks/          # Custom React hooks (useAuth, useFetch)
│   │   ├── services/       # Axios API client functions
│   │   ├── context/        # React Context providers (AuthContext)
│   │   └── utils/          # Formatting & calculation utilities
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                 # Node.js + Express + TypeScript Backend API
│   ├── src/
│   │   ├── config/         # DB connection & env validator
│   │   ├── models/         # Mongoose document schemas
│   │   ├── controllers/    # Express controllers
│   │   ├── routes/         # REST API router endpoints
│   │   ├── services/       # Business logic layer
│   │   ├── middleware/     # Auth, Zod validation, and error middlewares
│   │   ├── validators/     # Zod request validation schemas
│   │   └── utils/          # JWT, bcrypt, and AppError utilities
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## ⚙️ Required Environment Variables

### Backend (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/invoice_expense_manager
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)
Create `client/.env` based on `client/.env.example`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Getting Started

### 1. Install Dependencies

Install dependencies for both backend and frontend:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Start Development Servers

Run backend and frontend in separate terminal windows:

#### Start Express Server (Backend):
```bash
cd server
npm run dev
```
*Backend will start on `http://localhost:5000`*

#### Start Vite Client (Frontend):
```bash
cd client
npm run dev
```
*Frontend will start on `http://localhost:5173`*

---

## 🧪 Verification & Type Checks

```bash
# Type check Server
cd server
npm run type-check

# Type check Client
cd client
npm run lint
```
