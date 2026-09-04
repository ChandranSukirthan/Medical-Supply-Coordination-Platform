# MedBridge LK — Medical Supply & Shortage Coordination Platform

**MedBridge LK** is an intelligent inter-hospital coordination and medical supply management platform for Sri Lanka's healthcare network. It connects hospitals across all provinces, enabling administrators to report critical medicine shortages, locate nearby surplus supplies, request inter-hospital provisions with automatic real-time stock deduction, and receive AI-driven match recommendations.

---

## Architecture Overview

```text
       +-------------------------------------------------------------+
       |               React 19 SPA (Vite + Tailwind)                |
       |  (Dashboard, Match Supply, Shortage Ticket, AI Analysis)   |
       +------------------------------+------------------------------+
                                      | HTTP / REST (JWT Bearer)
                                      v
       +-------------------------------------------------------------+
       |               Node.js / Express 5 API Server                |
       |  - JWT Authentication & Hospital Facility Identity          |
       |  - Stock, Request, Offer & Transaction Lifecycles           |
       |  - Inter-Hospital Transfers & Atomic Stock Deduction        |
       |  - In-Memory Serverless DB Pooling & CORS Security          |
       +-------------------+--------------------+--------------------+
                           |                    |
             Mongoose / DB |                    | HTTP REST / JSON
                           v                    v
         +--------------------+       +------------------------------+
         | MongoDB Atlas      |       | Python FastAPI Microservice  |
         | Cloud Cluster      |       | - Urgency Scoring & Ranking  |
         | (Replica Set ACID) |       | - Distance & Expiry Analysis |
         +--------------------+       +------------------------------+
```

- **Frontend**: React 19, Vite 8, Tailwind CSS 4, Lucide React, Axios, React Router 7.
- **Backend API**: Node.js, Express 5, Mongoose 9, JWT, bcryptjs, CORS.
- **Database**: MongoDB Atlas (supports atomic operations for stock deductions and transactions).
- **AI Service**: Python 3.10+, FastAPI, Pydantic, Scikit-learn (intelligent match scoring).

---

## Core Features & Workflows

### 1. Hospital Facility Authentication & Demo Switcher
- Administrators register with official hospital identity (`hospitalId`, facility name, city, province).
- Secure stateless authentication using JSON Web Tokens (JWT).
- **Quick Facility Switcher**: In-app profile switcher to instantly toggle active hospital sessions between **Jaffna (`JF001`)**, **Kilinochchi (`KK001`)**, and **Colombo (`H001`)** without re-logging in, allowing seamless testing of multi-hospital interactions.

### 2. Medicine Shortage Reporting
- Report critical supply deficiencies specifying medicine name, quantity, required date, and urgency (`HIGH`, `MEDIUM`, `LOW`).
- Clear status tracking: `open` &rarr; `accepted` &rarr; `completed` / `cancelled`.

### 3. Surplus Inventory & Ownership Demarcation
- Register available hospital surplus with batch expiry dates.
- Clear visual separation in the UI between **"Your Facility Inventory"** (internal stock) and external **"Donor Facility Stock"** (`Donor: Facility Name (ID)`).

### 4. Inter-Hospital Provision Requests & Atomic Stock Deduction
- Facilities facing shortages can request exact quantities from any external hospital's surplus stock.
- The donor hospital receives an instant unread notification in their notifications center.
- When the donor hospital clicks **Accept**, the exact approved quantity is **atomically deducted from MongoDB Atlas** in real time.
- If rejected, the requesting facility is notified and donor inventory remains intact.

### 5. AI-Assisted Recommendation Engine
- Scores potential donor matches based on proximity (same province / nearest district), urgency alignment, and medicine batch expiry.
- Provides human-readable reasoning explanations for each recommendation.
- Seamless fallback to rule-based matching if the Python service is offline.

---

## Quick Start & Local Setup

### Prerequisites
- Node.js 20+
- MongoDB 6+ (or MongoDB Atlas connection URI)
- Python 3.10+ *(optional, only for the AI recommendation service)*

---

### 1. Backend Setup

```bash
cd Backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and verify MONGO_URI and JWT_SECRET

# Seed MongoDB with realistic Sri Lankan hospital & stock data
npm run seed

# Start development server
npm run dev
# Backend runs on http://localhost:5001 (or port specified in .env)
```

### 2. Frontend Setup

```bash
cd Frontend/medbridge-frontend
npm install

# Start Vite development server
npm run dev
# Frontend runs on http://localhost:5173
```

### 3. (Optional) AI Service Setup

```bash
cd ai-service
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Seed Data & Demo Accounts

Run `npm run seed` inside `Backend/` to populate MongoDB Atlas with hospitals, stock, and active shortages:

| Hospital Name | Hospital ID | Email | Password | Province |
| :--- | :--- | :--- | :--- | :--- |
| **Jaffna General Hospital** | `JF001` | `sukirsukirthan347@gmail.com` | `password123` | Northern |
| **Kilinochchi Base Hospital** | `KK001` | `sukirthan@gmail.com` | `password123` | Northern |
| **Colombo National Hospital** | `H001` | `demo@medbridge.lk` | `MedBridgeDemo123!` | Western |
| **Kandy Teaching Hospital** | `H002` | `h002@medbridge.lk` | `password123` | Central |
| **Karapitiya Teaching Hospital** | `H003` | `h003@medbridge.lk` | `password123` | Southern |
| **Teaching Hospital Anuradhapura** | `H005` | `h005@medbridge.lk` | `password123` | North Central |

---

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | API Server listening port | `5000` or `5001` |
| `MONGO_URI` | MongoDB Atlas / local connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0` |
| `JWT_SECRET` | Secret key for signing authorization JWTs | `medbridge_lk_production_jwt_secret_key_2026` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `*` or `https://<your-app>.vercel.app` |
| `AI_SERVICE_URL` | Python FastAPI recommendation URL | `http://localhost:8000` |
| `AI_REQUEST_TIMEOUT_MS` | AI microservice timeout limit | `5000` |

### Frontend (`Frontend/medbridge-frontend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Live backend API base URL | `https://<your-backend>.onrender.com/api/v1` |

---

## API Reference

All protected routes require an `Authorization: Bearer <JWT>` header. All responses are in JSON format.

### Health & Root
- `GET /`: Service identification and status overview.
- `GET /api/v1/health`: Returns `{ "success": true, "status": "healthy" }`.

### Authentication (`/api/v1/auth`)
- `POST /register`: Register hospital and admin account.
- `POST /login`: Log in with email/password; returns JWT and user profile with hospital details.
- `GET /me`: Get authenticated user profile and hospital identity.
- `GET /hospitals`: List all registered hospitals across the network.

### Stock Management (`/api/v1/stock`)
- `POST /`: Add new available medicine stock (hospital bound from JWT).
- `GET /my`: List stock owned by the authenticated hospital.
- `GET /available`: List all unexpired, available surplus stock across all hospitals.
- `GET /:id`: Fetch stock item details.
- `PUT /:id`: Update stock item.
- `DELETE /:id`: Remove stock item.

### Shortage Requests (`/api/v1/requests`)
- `POST /`: Submit new medicine shortage ticket.
- `GET /open`: List all active, non-overdue shortage requisitions across all hospitals.
- `GET /my`: List shortage requests reported by the current hospital.
- `GET /:id`: Fetch single shortage requisition.
- `PUT /:id`: Update shortage ticket details.
- `PATCH /:id/cancel`: Cancel an open shortage ticket.

### Inter-Hospital Transfers (`/api/v1/transfers`)
- `POST /request`: Request a medicine provision from a donor hospital's surplus stock.
- `GET /notifications`: Fetch incoming pending provision requests for current donor facility.
- `POST /:transferId/accept`: Accept incoming transfer; **atomically deducts exact approved stock quantity in MongoDB**.
- `POST /:transferId/reject`: Decline incoming provision request.
- `GET /my`: List all transfer activities (both requested and supplied) for current hospital.

### AI Recommendations (`/api/v1/recommendations`)
- `GET /requests/:requestId`: Request ranked donor suggestions with AI reasoning.
- `GET /stock/:stockId`: Request candidate recipient shortages for excess stock.

---

## Deployment Guide

### Deploying Backend to Render
1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Set **Root Directory** to `Backend`.
4. Build Command: `npm install` | Start Command: `npm start`.
5. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (set to `*`).
6. In MongoDB Atlas, ensure **Network Access** allows `0.0.0.0/0` (Anywhere).

### Deploying Frontend to Vercel
1. Import your GitHub repository on [Vercel](https://vercel.com/).
2. Set **Root Directory** to `Frontend/medbridge-frontend`.
3. Framework Preset: `Vite`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-render-backend-name>.onrender.com/api/v1`
5. Deploy. SPA routing is pre-configured via `vercel.json`.

---

## Project Structure

```text
Medical-Supply-Coordination-Platform/
├── Backend/
│   ├── api/
│   │   └── index.js              # Vercel serverless function entrypoint
│   ├── config/
│   │   └── db.js                 # MongoDB connection & connection pooling
│   ├── controllers/              # Business logic controllers
│   │   ├── authController.js
│   │   ├── stockController.js
│   │   ├── requestController.js
│   │   ├── transferController.js # Provision requests, notifications & stock deduction
│   │   ├── offerController.js
│   │   ├── transactionController.js
│   │   └── recommendationController.js
│   ├── middleware/               # Auth (JWT) & error handling middleware
│   ├── models/                   # Mongoose schemas
│   │   ├── Hospital.js
│   │   ├── User.js
│   │   ├── Stock.js
│   │   ├── MedicineRequest.js
│   │   ├── TransferRequest.js
│   │   ├── Offer.js
│   │   └── Transaction.js
│   ├── routes/                   # Express routes
│   ├── seed/
│   │   └── seed.js               # Database seeding script with SL hospital data
│   ├── app.js                    # Express app definition & CORS policy
│   ├── server.js                 # HTTP server entrypoint
│   ├── vercel.json               # Backend Vercel deployment configuration
│   └── package.json
├── Frontend/
│   └── medbridge-frontend/
│       ├── src/
│       │   ├── pages/            # React views
│       │   │   ├── Home.jsx
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   ├── ReportShortage.jsx
│       │   │   ├── MatchSupply.jsx
│       │   │   ├── AboutUs.jsx
│       │   │   └── Analysis.jsx
│       │   ├── App.jsx           # Client router & navigation
│       │   ├── AuthContext.jsx   # Authentication context & quick facility switcher
│       │   ├── api.js            # Axios client with auto URL normalization
│       │   └── main.jsx
│       ├── vercel.json           # Frontend SPA client routing rules
│       ├── vite.config.js
│       └── package.json
├── ai-service/                   # FastAPI recommendation microservice
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   └── services/
│   └── requirements.txt
└── README.md
```

---

## License
Licensed under the ISC License. Designed for hospital medical coordination and emergency supply redistribution across Sri Lanka.
