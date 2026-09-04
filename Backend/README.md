# MedBridge LK Backend

MedBridge LK is a Medical Supply Coordination Platform designed for Sri Lankan hospitals to manage inventory, broadcast shortages, handle offers, and track medicine transfers.

## Architecture

The final architecture consists of:
1. **React Frontend** (UI, navigation, user interaction)
2. **Node.js / Express Backend** (Authentication, Authorization, Business Logic, Validation, DB Access, AI Adapter)
3. **MongoDB** (Persistent Data Store)
4. **Python FastAPI AI Service** (Matching, recommendation, scoring, ranking)

**Flow:**
React -> Node.js -> MongoDB
React -> Node.js -> AI Data Adapter -> Python AI Service

> **Responsibility Boundaries**:
> - **React**: Owns UI, routing, displaying data and recommendations. Must NEVER connect directly to MongoDB or directly call Python AI.
> - **Node.js**: Owns Auth, MongoDB operations, Hospitals, Medicine stock, Medicine requests, Offers, Transactions, Business Rules, Validation, and AI API communication.
> - **Python AI**: Owns supplier Matching, Recommendation, Scoring, Ranking, and Recommendation Reasons.

## Installation & Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Setup Environment Variables (\`.env\`):
   \`\`\`env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/medical_supply
   JWT_SECRET=your_super_secret_jwt_key
   PYTHON_AI_URL=http://localhost:8000/api/v1/recommend/suppliers
   \`\`\`

3. Ensure MongoDB is running locally or provide a valid Atlas URI.

## How to Run the Backend

To run the backend server in development mode:
\`\`\`bash
npm run dev
\`\`\`
Or using node directly:
\`\`\`bash
node server.js
\`\`\`

## Seed Data

To populate the development database with test data (10 hospitals, 15 stock records, 10 medicine requests including edge cases like 0 quantity, expired stock, unavailable status, and cancelled requests):

\`\`\`bash
node scripts/seed.js
\`\`\`

**Note**: These are DEVELOPMENT/DEMO records only. They do not represent real hospital inventory in Sri Lanka.

## Testing

To run the End-to-End, Validation, and Security test suite:
1. Start the server (\`node server.js\`)
2. Run the test script:
   \`\`\`bash
   node tests/e2e.js
   \`\`\`

### Testing Coverage
- **Security**: Validates unauthorized request rejection, JWT signature check, cross-hospital modification prevention.
- **Validation**: Rejects negative/zero stock, invalid states, invalid state transitions (e.g., trying to start a completed transaction).
- **AI Testing**: Validates fallback behavior if the Python AI service is unavailable/times out. Core application remains functional.
- **End-to-End**: Follows the full lifecycle of logging in, creating a request, matching recommendations, supplier offering, acceptance, and complete transaction flow.

## AI Integration Details

The Node.js backend serves as a bridge to the Python AI service.

### AI Request Contract
When a hospital requests recommendations, Node.js maps the request and available stock data and sends the following JSON to \`POST /api/v1/recommend/suppliers\`:

\`\`\`json
{
  "request": {
    "id": "64f1b...2a1",
    "medicine": "Insulin",
    "quantity": 80,
    "urgency": "HIGH",
    "location": "Matara"
  },
  "stocks": [
    {
      "stockId": "STK010",
      "hospitalId": "64f1b...2b5",
      "hospitalName": "Matara District Hospital",
      "location": "Matara",
      "quantity": 100,
      "expiryDate": "2027-01-01T00:00:00.000Z"
    }
  ]
}
\`\`\`

### AI Response Contract
The Python service replies with ranked recommendations:

\`\`\`json
{
  "recommendations": [
    {
      "stockId": "STK010",
      "hospitalId": "64f1b...2b5",
      "score": 0.95,
      "reason": "High proximity and sufficient stock available."
    }
  ]
}
\`\`\`

---

## API Documentation

### Authentication
- **POST \`/api/v1/auth/register\`**
  - **Auth Required**: No
  - **Purpose**: Register a new hospital facility.
  - **Body**: \`{ hospitalId, hospitalName, email, password, location, province }\`
  - **Response**: 201 Created with JWT Token and Facility details.
  - **Errors**: 400 (Duplicate hospital ID or email).

- **POST \`/api/v1/auth/login\`**
  - **Auth Required**: No
  - **Purpose**: Login to an existing facility account.
  - **Body**: \`{ hospitalId, password }\`
  - **Response**: 200 OK with JWT Token and Facility details. Password hashes are NEVER returned.
  - **Errors**: 401 (Invalid hospital ID or password).

### Health
- **GET \`/api/v1/health\`**
  - **Auth Required**: No
  - **Purpose**: Health check endpoint.
  - **Response**: 200 OK \`{ status: 'ok', timestamp: ... }\`

### Stock
- **POST \`/api/v1/stock\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Add new stock to inventory.
  - **Body**: \`{ medicine, quantity, expiryDate, status }\`
  - **Response**: 201 Created stock object.
- **GET \`/api/v1/stock/my\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Retrieve all stock for the logged-in hospital.
- **GET \`/api/v1/stock/available\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Retrieve all available stock globally (quantity > 0, non-expired).
- **GET \`/api/v1/stock/:id\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Get specific stock details.
- **PUT \`/api/v1/stock/:id\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Update stock details. Hospital can only modify its own stock.
- **PATCH \`/api/v1/stock/:id/status\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Toggle stock availability status (\`AVAILABLE\` / \`UNAVAILABLE\`).
- **DELETE \`/api/v1/stock/:id\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Delete a stock entry.

### Requests
- **POST \`/api/v1/requests\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Broadcast a medicine shortage request.
  - **Body**: \`{ medicine, quantity, urgency, location, province, requiredBy }\`
- **GET \`/api/v1/requests/open\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: View all open requests globally.
- **GET \`/api/v1/requests/my\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: View requests created by the logged-in hospital.
- **GET \`/api/v1/requests/:id\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Get specific request details.
- **PUT \`/api/v1/requests/:id\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Update an existing request.
- **PATCH \`/api/v1/requests/:id/cancel\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Cancel a request.

### Offers
- **POST \`/api/v1/offers\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Supplier makes an offer to fulfill a request.
  - **Body**: \`{ requestId, quantity }\`
- **GET \`/api/v1/offers/my\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Retrieve offers made by the logged-in hospital.
- **GET \`/api/v1/requests/:requestId/offers\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Retrieve all offers for a specific request.
- **PATCH \`/api/v1/offers/:id/accept\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Requesting hospital accepts an offer.
- **PATCH \`/api/v1/offers/:id/reject\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Requesting hospital rejects an offer.
- **PATCH \`/api/v1/offers/:id/cancel\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Supplier cancels their offer.

### Transactions
- **GET \`/api/v1/transactions/my\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: View transactions where the logged-in hospital is either sender or receiver.
- **GET \`/api/v1/transactions/:id\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: View details of a specific transaction.
- **PATCH \`/api/v1/transactions/:id/start\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Sender initiates the dispatch. Changes state from \`PENDING\` to \`IN_TRANSIT\`.
- **PATCH \`/api/v1/transactions/:id/complete\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Receiver confirms delivery. Automatically deducts sender's stock and marks request as \`FULFILLED\`.
- **PATCH \`/api/v1/transactions/:id/cancel\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Either party cancels the transaction before completion.

### Recommendations
- **GET \`/api/v1/recommendations/requests/:requestId\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Retrieves AI-ranked supplier recommendations for a specific request.
- **GET \`/api/v1/recommendations/stock/:stockId\`**
  - **Auth Required**: Yes (JWT)
  - **Purpose**: Placeholder for potential future stock-to-recipient recommendation feature.
