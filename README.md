# MedBridge LK

MedBridge LK coordinates medicine requests, hospital stock, offers, transfers, and AI-assisted recommendations. The backend is a Node.js/Express API backed by MongoDB. The Python FastAPI service owns recommendation logic; it is not required for ordinary request, stock, or offer operations.

Seed records are development/demo data only. They do not represent real hospital inventory or patient information.

## Architecture

```text
React UI -> Node.js / Express -> MongoDB
                |
                +-> AI data adapter -> Python FastAPI
```

Node owns authentication, authorization, validation, MongoDB data, business rules, and AI API communication. Python owns matching, scoring, ranking, and recommendation reasons. React owns UI, navigation, forms, and displaying results. React never connects directly to MongoDB or Python.

## Setup

Requirements: Node.js 20+, MongoDB 6+ (a replica set is required for transaction acceptance/completion), and optionally the Python AI service.

```powershell
cd Backend
npm install
Copy-Item .env.example .env
# Edit .env and set JWT_SECRET and MONGO_URI
npm run seed       # optional: resets development collections
npm start
```

The API listens on `http://localhost:5000` by default. Run tests with `npm test` from `Backend`.

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Node API port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/medbridge_lk` |
| `JWT_SECRET` | Secret used to sign JWTs | required |
| `AI_SERVICE_URL` | Python FastAPI base URL | `http://localhost:8000` |
| `AI_REQUEST_TIMEOUT_MS` | AI request timeout | `5000` |
| `CLIENT_URL` | CORS origin | `http://localhost:5173` |

Never commit `.env` or use the demo JWT secret outside development.

## Authentication

Register or log in to receive a JWT. Send it on protected requests:

```text
Authorization: Bearer <token>
```

The hospital identity used for ownership and supplier fields always comes from the verified JWT, never from client input. Password hashes are excluded from normal user queries and responses.

## Data Models

- `Hospital`: `hospitalId`, name, location, province.
- `User`: `userId`, hospital, email, private `passwordHash`, role.
- `Stock`: `stockId`, hospital, medicine, quantity, `reservedQuantity`, location, province, expiry, status.
- `MedicineRequest`: request, requesting hospital, medicine, quantity, urgency, location, province, required date, status.
- `Offer`: offer, request, supplier hospital, medicine, offered quantity, status, message.
- `Transaction`: transaction, request, offer, supplier, recipient, medicine, quantity, status, timestamps, stock allocations.

## Workflows

Stock is available only when it is marked `available`, is not expired, and has positive `quantity - reservedQuantity`. Offer acceptance runs in a MongoDB transaction, claims the open request, atomically reserves current stock, creates a transaction, and cancels other pending offers. Completion atomically converts reservations into deducted stock. Cancellation releases reservations.

The transaction lifecycle is `pending -> in_transfer -> completed`. A pending or in-transfer transaction may be cancelled according to ownership rules. Completed and cancelled transactions cannot transition again.

Request lifecycle is `open -> accepted -> completed`; an open request may also become `cancelled`. Offers are created as `pending`; recipients can accept or reject, and suppliers can cancel. Only the requesting hospital accepts offers. Suppliers start transfers; recipients confirm completion.

## API Reference

All response bodies use JSON. Unless marked public, endpoints require a valid JWT. IDs accept the public IDs shown below and, where applicable, MongoDB ObjectIds.

### Authentication

| Method and endpoint | Auth | Purpose and body | Responses/errors |
| --- | --- | --- | --- |
| `POST /api/v1/auth/register` | No | Create hospital and admin. Body: `hospitalId`, `name`, `location`, `province`, `email`, `password`. | `201` user; `400` validation; `409` duplicate hospital/email. |
| `POST /api/v1/auth/login` | No | Body: `email`, `password`. | `200` token/user; `401` invalid credentials; `400` missing fields. |
| `GET /api/v1/auth/me` | Yes | Return current user and hospital. | `200`; `401` invalid token; `404` user not found. |

### Health

| Method and endpoint | Auth | Purpose | Response/errors |
| --- | --- | --- | --- |
| `GET /api/v1/health` | No | Check API process health. | `200 { success: true, status: "healthy" }`. |

### Stock

Stock body: `stockId`, `medicine`, `quantity`, `location`, `province`, `expiryDate`, optional `status` (`available` or `unavailable`). The hospital is taken from the JWT.

| Method and endpoint | Auth | Purpose | Responses/errors |
| --- | --- | --- | --- |
| `POST /api/v1/stock` | Yes | Create stock. | `201`; `400` invalid/negative quantity or date; `403` hospital mismatch; `409` duplicate. |
| `GET /api/v1/stock/my` | Yes | List current hospital stock. | `200`; `401`. |
| `GET /api/v1/stock/available` | Yes | List non-expired stock with unreserved units. | `200`; `401`. |
| `GET /api/v1/stock/:id` | Yes | Read stock by public or Mongo ID. | `200`; `404`; `401`. |
| `PUT /api/v1/stock/:id` | Yes, owner | Replace editable stock fields. | `200`; `400`; `403`; `404`; `409` below-reservation quantity. |
| `PATCH /api/v1/stock/:id/status` | Yes, owner | Body: `{ "status": "available" }` or `unavailable`. | `200`; `400`; `403`; `404`. |
| `DELETE /api/v1/stock/:id` | Yes, owner | Delete stock. | `200`; `403`; `404`. |

### Requests

Request body: `requestId`, `medicine`, integer `quantity`, `urgency` (`LOW`, `MEDIUM`, `HIGH`), `location`, `province`, and ISO `requiredBy`. Hospital comes from JWT.

| Method and endpoint | Auth | Purpose | Responses/errors |
| --- | --- | --- | --- |
| `POST /api/v1/requests` | Yes | Create an open medicine request. | `201`; `400` validation; `403`; `404` hospital. |
| `GET /api/v1/requests/open` | Yes | List all open, not-overdue requests. | `200`; `401`. |
| `GET /api/v1/requests/my` | Yes | List current hospital requests. | `200`; `401`. |
| `GET /api/v1/requests/:requestId/matches` | Yes, requester | List database-eligible suppliers without AI ranking. | `200`; `403`; `404`. |
| `GET /api/v1/requests/:id` | Yes | Read a request. | `200`; `404`; `401`. |
| `PUT /api/v1/requests/:id` | Yes, owner | Edit an open request using the request body above. | `200`; `400`; `403`; `404`; `409` non-open. |
| `PATCH /api/v1/requests/:id/cancel` | Yes, owner | Cancel an open request. | `200`; `403`; `404`; `409` non-open. |

### Offers

Offer body: `offerId`, `requestId`, `medicine`, integer `quantityOffered`, optional `message`. Supplier hospital comes from JWT.

| Method and endpoint | Auth | Purpose | Responses/errors |
| --- | --- | --- | --- |
| `POST /api/v1/offers` | Yes | Supplier creates a pending offer for another hospital's open request. | `201`; `400`; `403`; `404`; `409` request/stock conflict. |
| `GET /api/v1/offers/my` | Yes | List offers made by current hospital. | `200`; `401`. |
| `GET /api/v1/requests/:requestId/offers` | Yes, requester | List offers on a request. | `200`; `403`; `404`. |
| `PATCH /api/v1/offers/:id/accept` | Yes, requester | Atomically reserve stock and create a transaction. No body. | `201`; `403`; `404`; `409` request no longer open, offer not pending, or insufficient current stock. |
| `PATCH /api/v1/offers/:id/reject` | Yes, requester | Reject a pending offer. No body. | `200`; `403`; `404`; `409` non-pending. |
| `PATCH /api/v1/offers/:id/cancel` | Yes, supplier | Cancel a pending offer. No body. | `200`; `403`; `404`; `409` non-pending. |

### Transactions

Transactions are created by offer acceptance; there is no client-controlled transaction creation endpoint.

| Method and endpoint | Auth | Purpose | Responses/errors |
| --- | --- | --- | --- |
| `GET /api/v1/transactions/my` | Yes | List transactions where current hospital is supplier or recipient. | `200`; `401`. |
| `GET /api/v1/transactions/:id` | Yes, participant | Read a transaction. | `200`; `403`; `404`. |
| `PATCH /api/v1/transactions/:id/start` | Yes, supplier | Move `pending` to `in_transfer`. No body. | `200`; `403`; `404`; `409` invalid transition. |
| `PATCH /api/v1/transactions/:id/complete` | Yes, recipient | Deduct reserved stock and move to `completed`. No body. | `200`; `403`; `404`; `409` stock conflict/invalid transition. |
| `PATCH /api/v1/transactions/:id/cancel` | Yes, supplier or recipient | Release reservations and cancel a pending/in-transfer transaction. No body. | `200`; `403`; `404`; `409` invalid transition/stock conflict. |

### Recommendations

| Method and endpoint | Auth | Purpose | Query parameters and errors |
| --- | --- | --- | --- |
| `GET /api/v1/recommendations/requests/:requestId` | Yes, requester | Ask Python for supplier recommendations using current valid stock. | Optional `limit` (default 5, max 50); `403` ownership; `404`; `409` non-open; `503` AI unavailable. |
| `GET /api/v1/recommendations/stock/:stockId` | Yes, stock owner | Ask Python for recipient recommendations using current open requests. | Optional `limit`; `403` ownership; `404`; `409` unavailable/expired; `503` AI unavailable. |

AI failures return `503` with `success: false`, an empty `recommendations` array, and the message `AI recommendations are temporarily unavailable.` Core APIs do not call Python and continue operating.

## AI Contract

Node sends supplier recommendations to `POST /api/v1/recommend/suppliers`:

```json
{
  "request": {
    "requestId": "REQ001",
    "hospitalId": "H010",
    "medicine": "Insulin",
    "quantity": 80,
    "urgency": "HIGH",
    "location": "Matara",
    "province": "Southern",
    "requiredBy": "2026-09-15",
    "status": "open"
  },
  "availableStock": [
    {
      "stockId": "STK001",
      "hospitalId": "H001",
      "medicine": "Insulin",
      "quantity": 120,
      "location": "Colombo",
      "province": "Western",
      "expiryDate": "2027-02-10",
      "status": "available"
    }
  ],
  "limit": 5
}
```

Node sends recipient recommendations to `POST /api/v1/recommend/recipients`:

```json
{
  "stock": {
    "stockId": "STK001",
    "hospitalId": "H001",
    "medicine": "Insulin",
    "quantity": 120,
    "location": "Colombo",
    "province": "Western",
    "expiryDate": "2027-02-10",
    "status": "available"
  },
  "openRequests": [
    {
      "requestId": "REQ001",
      "hospitalId": "H010",
      "medicine": "Insulin",
      "quantity": 80,
      "urgency": "HIGH",
      "location": "Matara",
      "province": "Southern",
      "requiredBy": "2026-09-15",
      "status": "open"
    }
  ],
  "limit": 5
}
```

Python returns rankings unchanged, for example:

```json
{
  "requestId": "REQ001",
  "recommendations": [
    {
      "hospitalId": "H001",
      "matchScore": 96,
      "reasons": ["Medicine match", "Sufficient quantity", "Good location match"]
    }
  ]
}
```

The adapter converts internal request statuses to `open` or `cancelled`, stock statuses to `available` or `unavailable`, and sends reserved stock as currently available quantity. Node does not alter scores, ranking, or reasons.

## Seed Data

From `Backend`, run `npm run seed`. The script clears the development hospital, user, request, and stock collections and inserts:

- 10 Sri Lankan hospitals (`H001` through `H010`), users, and demo credentials.
- 10 medicine requests (`REQ001` through `REQ010`), including `REQ009` cancelled.
- 15 stock records (`STK001` through `STK015`), including `STK006` quantity zero, `STK007` expired, and `STK013` unavailable.
- All seeded users use `MedBridgeDemo123!` for local development only. Emails are `<hospital-id>@medbridge.demo`.

The seed includes `H010` in Matara and `REQ001` for 80 Insulin units to support the demo workflow. Use a unique request ID when repeating the scenario after seeding.

## Testing

The current automated suite uses Node's built-in test runner and mocks `fetch`, so it never requires Python to run. It verifies exact supplier/recipient payloads, date and status conversion, successful recommendations, connection failure, invalid response, and timeout handling.

```powershell
cd Backend
npm test
```

For the full manual demo: log in as `H010`, create an open Insulin request, call the open-request and supplier-recommendation endpoints, create an offer from a suitable supplier, accept it as H010, start it as the supplier, and complete it as H010. Then verify the transaction is `completed`, the request is `completed`, the offer is `completed`, and supplier quantity decreased by the transferred amount while never becoming negative.

The automated suite does not start MongoDB or Python and therefore does not claim to replace a deployed MongoDB replica-set end-to-end run. That run should be performed in an environment with the configured database and FastAPI service.

## Backend Structure

```text
Backend/
  app.js
  server.js
  config/db.js
  controllers/       auth, stock, request, offer, transaction, recommendation
  middleware/        authentication and error handling
  models/            Hospital, User, Stock, MedicineRequest, Offer, Transaction
  routes/            auth, stock, request, offer, transaction, recommendation
  services/          matching, AI client, AI data adapter
  seed/seed.js
  test/aiIntegration.test.js
```
