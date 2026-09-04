# Medical Supply AI Service

A Python-based AI recommendation engine for hospital medicine stock sharing.

Built with **FastAPI** · **Pydantic v2** · **Python 3.11+**

---

## What It Does

Given a hospital's medicine **request** or available **stock**, the AI returns ranked recommendations:

| Operation | Input | Output |
|-----------|-------|--------|
| `POST /recommend/suppliers` | A medicine request | Best hospitals that can supply it |
| `POST /recommend/recipients` | An available stock item | Best open requests that need it |

Recommendations are scored 0–100 using a configurable weighted algorithm. The AI never approves or blocks transactions — it only suggests.

---

## Quickstart

### 1. Prerequisites
- Python 3.11 or later
- pip

### 2. Install dependencies
```bash
cd ai-service
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

### 4. Run the service
```bash
uvicorn app.main:app --reload --port 8000
```

The service starts at **http://localhost:8000**

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/api/v1/health

---

## Running Tests

```bash
cd ai-service
pytest tests/ -v
```

Expected output: all tests pass ✅

---

## Scoring Algorithm

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Medicine compatibility | 40% | Exact case-insensitive name match |
| Quantity compatibility | 25% | `min(available / requested, 1.0)` |
| Urgency | 15% | HIGH=1.0, MEDIUM=0.65, LOW=0.30 |
| Location | 10% | Same city=1.0, Same province=0.6, Other=0.1 |
| Expiry | 10% | >6mo=1.0, 3-6mo=0.75, 1-3mo=0.50, <1mo=0.25 |

Weights are configurable via `.env` — they must sum to `1.0`.

---

## Business Rules

The AI **never** recommends:
- Expired stock (expiry date ≤ today)
- Stock with quantity = 0
- Stock with status ≠ `available`
- A hospital's own stock to itself
- Cancelled or closed requests
- Wrong medicine (name must match)

Partial quantity is allowed — the score is reduced proportionally.

---

## API Reference

### `GET /api/v1/health`

**Response `200 OK`:**
```json
{
  "status": "ok",
  "service": "Medical Supply AI Service",
  "version": "1.0.0"
}
```

---

### `POST /api/v1/recommend/suppliers`

Find the best hospitals that can supply a medicine request.

**Request body:**
```json
{
  "request": {
    "requestId": "REQ001",
    "hospitalId": "H010",
    "medicine": "Insulin",
    "quantity": 100,
    "urgency": "HIGH",
    "location": "Colombo",
    "province": "Western",
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
    },
    {
      "stockId": "STK002",
      "hospitalId": "H002",
      "medicine": "Insulin",
      "quantity": 60,
      "location": "Kandy",
      "province": "Central",
      "expiryDate": "2027-01-15",
      "status": "available"
    }
  ],
  "limit": 5
}
```

**Response `200 OK`:**
```json
{
  "requestId": "REQ001",
  "medicine": "Insulin",
  "totalCandidates": 2,
  "recommendations": [
    {
      "hospitalId": "H001",
      "stockId": "STK001",
      "matchScore": 97,
      "reasons": [
        "Medicine name matches",
        "Sufficient quantity available",
        "High urgency request — prioritised",
        "Same city/district",
        "Stock expiry is well within safe range"
      ],
      "canFulfil": true,
      "availableQty": 120
    },
    {
      "hospitalId": "H002",
      "stockId": "STK002",
      "matchScore": 78,
      "reasons": [
        "Medicine name matches",
        "Partial quantity available (60% of requested)",
        "High urgency request — prioritised",
        "Stock expiry is well within safe range"
      ],
      "canFulfil": false,
      "availableQty": 60
    }
  ]
}
```

**Field descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | string | Echo of the original request ID |
| `medicine` | string | Medicine that was matched |
| `totalCandidates` | int | Total stock items evaluated (before filtering) |
| `recommendations[].hospitalId` | string | Supplying hospital ID |
| `recommendations[].stockId` | string \| null | Specific stock record ID |
| `recommendations[].matchScore` | int (0–100) | Overall match score |
| `recommendations[].reasons` | string[] | Human-readable reasons |
| `recommendations[].canFulfil` | bool | True if stock quantity ≥ requested |
| `recommendations[].availableQty` | int | Actual available units |

**Urgency values:** `"HIGH"` | `"MEDIUM"` | `"LOW"`

**Status values (request):** `"open"` | `"closed"` | `"cancelled"` | `"fulfilled"`

**Status values (stock):** `"available"` | `"unavailable"` | `"reserved"`

---

### `POST /api/v1/recommend/recipients`

Find the best open requests for an available stock item.

**Request body:**
```json
{
  "stock": {
    "stockId": "STK001",
    "hospitalId": "H001",
    "medicine": "Insulin",
    "quantity": 100,
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
      "location": "Colombo",
      "province": "Western",
      "status": "open"
    },
    {
      "requestId": "REQ002",
      "hospitalId": "H015",
      "medicine": "Insulin",
      "quantity": 200,
      "urgency": "MEDIUM",
      "location": "Galle",
      "province": "Southern",
      "status": "open"
    }
  ],
  "limit": 5
}
```

**Response `200 OK`:**
```json
{
  "hospitalId": "H001",
  "medicine": "Insulin",
  "totalCandidates": 2,
  "recommendations": [
    {
      "requestId": "REQ001",
      "hospitalId": "H010",
      "matchScore": 95,
      "reasons": [
        "Medicine name matches",
        "Sufficient quantity available",
        "High urgency request — prioritised",
        "Same city/district",
        "Stock expiry is well within safe range"
      ],
      "canFulfil": true,
      "requestedQty": 80
    },
    {
      "requestId": "REQ002",
      "hospitalId": "H015",
      "matchScore": 62,
      "reasons": [
        "Medicine name matches",
        "Partial quantity available (50% of requested)",
        "Medium urgency request"
      ],
      "canFulfil": false,
      "requestedQty": 200
    }
  ]
}
```

---

## Error Responses

| Status | When |
|--------|------|
| `422 Unprocessable Entity` | Missing or invalid fields in request body |
| `405 Method Not Allowed` | Wrong HTTP method |
| `404 Not Found` | Unknown endpoint |

**Example 422 response:**
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "request", "medicine"],
      "msg": "Field required"
    }
  ]
}
```

---

## Node.js Integration Guide

Install a HTTP client in your Node.js backend:
```bash
npm install axios
```

Create `utils/aiService.js`:
```javascript
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Get ranked supplier recommendations for a medicine request.
 * @param {Object} request  - The medicine request document from MongoDB
 * @param {Array}  stocks   - Available stock items from other hospitals
 * @param {number} limit    - Max results (default 5)
 */
async function recommendSuppliers(request, stocks, limit = 5) {
  const response = await axios.post(`${AI_SERVICE_URL}/api/v1/recommend/suppliers`, {
    request: {
      requestId: request._id.toString(),
      hospitalId: request.hospitalId.toString(),
      medicine: request.medicine,
      quantity: request.quantity,
      urgency: request.urgency,        // "HIGH" | "MEDIUM" | "LOW"
      location: request.location,
      province: request.province || null,
      status: request.status,
    },
    availableStock: stocks.map(s => ({
      stockId: s._id.toString(),
      hospitalId: s.hospitalId.toString(),
      medicine: s.medicine,
      quantity: s.quantity,
      location: s.location,
      province: s.province || null,
      expiryDate: s.expiryDate.toISOString().split('T')[0],  // "YYYY-MM-DD"
      status: s.status,
    })),
    limit,
  });
  return response.data;
}

/**
 * Get ranked recipient recommendations for available stock.
 * @param {Object} stock    - The available stock document from MongoDB
 * @param {Array}  requests - Open medicine requests from other hospitals
 * @param {number} limit    - Max results (default 5)
 */
async function recommendRecipients(stock, requests, limit = 5) {
  const response = await axios.post(`${AI_SERVICE_URL}/api/v1/recommend/recipients`, {
    stock: {
      stockId: stock._id.toString(),
      hospitalId: stock.hospitalId.toString(),
      medicine: stock.medicine,
      quantity: stock.quantity,
      location: stock.location,
      province: stock.province || null,
      expiryDate: stock.expiryDate.toISOString().split('T')[0],
      status: stock.status,
    },
    openRequests: requests.map(r => ({
      requestId: r._id.toString(),
      hospitalId: r.hospitalId.toString(),
      medicine: r.medicine,
      quantity: r.quantity,
      urgency: r.urgency,
      location: r.location,
      province: r.province || null,
      status: r.status,
    })),
    limit,
  });
  return response.data;
}

module.exports = { recommendSuppliers, recommendRecipients };
```

Add to your `.env` in the Node.js backend:
```env
AI_SERVICE_URL=http://localhost:8000
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_SERVICE_PORT` | `8000` | Port to run the service on |
| `WEIGHT_MEDICINE` | `0.40` | Medicine match weight |
| `WEIGHT_QUANTITY` | `0.25` | Quantity match weight |
| `WEIGHT_URGENCY` | `0.15` | Urgency weight |
| `WEIGHT_LOCATION` | `0.10` | Location match weight |
| `WEIGHT_EXPIRY` | `0.10` | Expiry safety weight |
| `DEFAULT_LIMIT` | `5` | Default max recommendations |
| `ALLOWED_ORIGINS` | `http://localhost:5000,...` | CORS allowed origins |

> **Note:** All `WEIGHT_*` values must sum to exactly `1.0` or the service will refuse to start.

---

## Project Structure

```
ai-service/
├── app/
│   ├── main.py          # FastAPI app factory + CORS
│   ├── config.py        # Env vars + weight validation
│   ├── api/
│   │   └── routes.py    # HTTP route handlers (thin layer)
│   ├── models/
│   │   └── schemas.py   # Pydantic request/response models
│   ├── services/
│   │   ├── recommender.py  # Orchestrator (filter → score → rank)
│   │   ├── matcher.py      # Business-rule filtering
│   │   └── scorer.py       # Weighted scoring algorithm
│   └── utils/
│       └── distance.py     # Location comparison helpers
├── tests/
│   ├── conftest.py      # Shared fixtures
│   ├── test_matcher.py  # Business-rule unit tests
│   ├── test_scorer.py   # Scoring unit tests
│   └── test_api.py      # Endpoint integration tests
├── sample_data/
│   ├── hospitals.json
│   ├── stock.json
│   └── requests.json
├── requirements.txt
├── .env.example
└── README.md
```

