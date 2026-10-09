# 🏦 Loan Management System (LMS)

A full-stack Loan Management System with a **Borrower Portal** (multi-step loan application) and an **Operations Dashboard** (RBAC-gated lifecycle management).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT + bcrypt |
| Validation | Zod |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017 (or a MongoDB Atlas URI)

### 1. Clone & Install

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Setup

```bash
# Server
cp server/.env.example server/.env

# Client
cp client/.env.example client/.env.local
```

### 3. Seed Test Data

```bash
cd server && npm run seed
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 3000)
cd client && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@lms.com | password123 |
| Sales | sales@lms.com | password123 |
| Sanction | sanction@lms.com | password123 |
| Disbursement | disbursement@lms.com | password123 |
| Collection | collection@lms.com | password123 |
| Borrower | borrower@lms.com | password123 |

## Project Structure

```
LMS_Assignment/
├── client/               # Next.js frontend
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth context provider
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities, API client, types
│   └── ...
├── server/               # Express.js backend
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/    # Auth, RBAC middleware
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API routes
│   │   ├── seeds/        # Seed data script
│   │   ├── services/     # Business logic (BRE, calculator)
│   │   ├── types/        # TypeScript type definitions
│   │   └── validators/   # Zod request validators
│   └── ...
└── README.md
```
