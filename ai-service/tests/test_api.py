"""
test_api.py — Integration tests for FastAPI endpoints.

Uses FastAPI's TestClient (backed by httpx) to make real HTTP requests
against the running app and verify full request → response behaviour.
"""

from __future__ import annotations

from datetime import date, timedelta


# ─── Helpers ──────────────────────────────────────────────────────────────────

def future(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def past(days: int) -> str:
    return (date.today() - timedelta(days=days)).isoformat()


# ─── GET /api/v1/health ───────────────────────────────────────────────────────

class TestHealth:

    def test_health_returns_200(self, client):
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_health_response_body(self, client):
        data = client.get("/api/v1/health").json()
        assert data["status"] == "ok"
        assert "service" in data
        assert "version" in data


# ─── POST /api/v1/recommend/suppliers ────────────────────────────────────────

class TestRecommendSuppliers:

    def _valid_payload(self, stock_items: list[dict]) -> dict:
        return {
            "request": {
                "requestId": "REQ001",
                "hospitalId": "H010",
                "medicine": "Insulin",
                "quantity": 100,
                "urgency": "HIGH",
                "location": "Colombo",
                "province": "Western",
                "status": "open",
            },
            "availableStock": stock_items,
            "limit": 5,
        }

    def _good_stock(self, hospital_id: str = "H001", quantity: int = 120) -> dict:
        return {
            "stockId": f"STK_{hospital_id}",
            "hospitalId": hospital_id,
            "medicine": "Insulin",
            "quantity": quantity,
            "location": "Colombo",
            "province": "Western",
            "expiryDate": future(300),
            "status": "available",
        }

    def test_valid_request_returns_200(self, client):
        payload = self._valid_payload([self._good_stock()])
        response = client.post("/api/v1/recommend/suppliers", json=payload)
        assert response.status_code == 200

    def test_response_contains_required_fields(self, client):
        payload = self._valid_payload([self._good_stock()])
        data = client.post("/api/v1/recommend/suppliers", json=payload).json()
        assert "requestId" in data
        assert "recommendations" in data
        assert "totalCandidates" in data
        assert data["requestId"] == "REQ001"

    def test_results_sorted_descending_by_score(self, client):
        payload = self._valid_payload([
            self._good_stock("H001", 120),   # same city, full qty
            self._good_stock("H002", 20),    # same city, low qty
        ])
        payload["availableStock"][1]["location"] = "Kandy"
        payload["availableStock"][1]["province"] = "Central"

        data = client.post("/api/v1/recommend/suppliers", json=payload).json()
        scores = [r["matchScore"] for r in data["recommendations"]]
        assert scores == sorted(scores, reverse=True)

    def test_score_is_integer_in_range(self, client):
        payload = self._valid_payload([self._good_stock()])
        data = client.post("/api/v1/recommend/suppliers", json=payload).json()
        for rec in data["recommendations"]:
            assert isinstance(rec["matchScore"], int)
            assert 0 <= rec["matchScore"] <= 100

    def test_reasons_list_present(self, client):
        payload = self._valid_payload([self._good_stock()])
        data = client.post("/api/v1/recommend/suppliers", json=payload).json()
        for rec in data["recommendations"]:
            assert "reasons" in rec
            assert isinstance(rec["reasons"], list)

    def test_no_matching_stock_returns_empty_list(self, client):
        """No Insulin stock → empty recommendations (not an error)."""
        payload = self._valid_payload([{
            "stockId": "STK003",
            "hospitalId": "H003",
            "medicine": "Paracetamol",
            "quantity": 500,
            "location": "Galle",
            "province": "Southern",
            "expiryDate": future(300),
            "status": "available",
        }])
        data = client.post("/api/v1/recommend/suppliers", json=payload).json()
        assert data["recommendations"] == []

    def test_expired_stock_excluded(self, client):
        payload = self._valid_payload([{
            "stockId": "STK_EXP",
            "hospitalId": "H001",
            "medicine": "Insulin",
            "quantity": 100,
            "location": "Colombo",
            "province": "Western",
            "expiryDate": past(1),
            "status": "available",
        }])
        data = client.post("/api/v1/recommend/suppliers", json=payload).json()
        assert data["recommendations"] == []

    def test_same_hospital_excluded(self, client):
        """Stock from the requesting hospital itself must not appear."""
        payload = self._valid_payload([{
            "stockId": "STK_SELF",
            "hospitalId": "H010",  # same as requester
            "medicine": "Insulin",
            "quantity": 100,
            "location": "Matara",
            "province": "Southern",
            "expiryDate": future(300),
            "status": "available",
        }])
        data = client.post("/api/v1/recommend/suppliers", json=payload).json()
        assert data["recommendations"] == []

    def test_limit_respected(self, client):
        stocks = [self._good_stock(f"H00{i}", 100) for i in range(1, 8)]
        payload = self._valid_payload(stocks)
        payload["limit"] = 3
        data = client.post("/api/v1/recommend/suppliers", json=payload).json()
        assert len(data["recommendations"]) <= 3

    def test_invalid_payload_returns_422(self, client):
        """Missing required fields should return 422 Unprocessable Entity."""
        response = client.post("/api/v1/recommend/suppliers", json={"request": {}})
        assert response.status_code == 422

    def test_empty_stock_list_returns_empty_recommendations(self, client):
        payload = self._valid_payload([])
        data = client.post("/api/v1/recommend/suppliers", json=payload).json()
        assert data["recommendations"] == []


# ─── POST /api/v1/recommend/recipients ───────────────────────────────────────

class TestRecommendRecipients:

    def _valid_payload(self, requests: list[dict]) -> dict:
        return {
            "stock": {
                "stockId": "STK001",
                "hospitalId": "H001",
                "medicine": "Insulin",
                "quantity": 100,
                "location": "Colombo",
                "province": "Western",
                "expiryDate": future(300),
                "status": "available",
            },
            "openRequests": requests,
            "limit": 5,
        }

    def _good_request(self, hospital_id: str, urgency: str = "HIGH", quantity: int = 80) -> dict:
        return {
            "requestId": f"REQ_{hospital_id}",
            "hospitalId": hospital_id,
            "medicine": "Insulin",
            "quantity": quantity,
            "urgency": urgency,
            "location": "Colombo",
            "province": "Western",
            "status": "open",
        }

    def test_valid_request_returns_200(self, client):
        payload = self._valid_payload([self._good_request("H010")])
        response = client.post("/api/v1/recommend/recipients", json=payload)
        assert response.status_code == 200

    def test_response_contains_required_fields(self, client):
        payload = self._valid_payload([self._good_request("H010")])
        data = client.post("/api/v1/recommend/recipients", json=payload).json()
        assert "hospitalId" in data
        assert "recommendations" in data
        assert "totalCandidates" in data
        assert data["hospitalId"] == "H001"

    def test_results_sorted_descending_by_score(self, client):
        payload = self._valid_payload([
            self._good_request("H010", urgency="HIGH"),
            self._good_request("H015", urgency="LOW"),
        ])
        data = client.post("/api/v1/recommend/recipients", json=payload).json()
        scores = [r["matchScore"] for r in data["recommendations"]]
        assert scores == sorted(scores, reverse=True)

    def test_cancelled_request_excluded(self, client):
        payload = self._valid_payload([{
            "requestId": "REQ009",
            "hospitalId": "H002",
            "medicine": "Insulin",
            "quantity": 30,
            "urgency": "HIGH",
            "location": "Kandy",
            "province": "Central",
            "status": "cancelled",
        }])
        data = client.post("/api/v1/recommend/recipients", json=payload).json()
        assert data["recommendations"] == []

    def test_wrong_medicine_excluded(self, client):
        payload = self._valid_payload([{
            "requestId": "REQ003",
            "hospitalId": "H007",
            "medicine": "Paracetamol",
            "quantity": 300,
            "urgency": "LOW",
            "location": "Anuradhapura",
            "province": "North Central",
            "status": "open",
        }])
        data = client.post("/api/v1/recommend/recipients", json=payload).json()
        assert data["recommendations"] == []

    def test_no_matching_requests_returns_empty_list(self, client):
        payload = self._valid_payload([])
        data = client.post("/api/v1/recommend/recipients", json=payload).json()
        assert data["recommendations"] == []

    def test_invalid_payload_returns_422(self, client):
        response = client.post("/api/v1/recommend/recipients", json={"stock": {}})
        assert response.status_code == 422

    def test_score_is_integer_in_range(self, client):
        payload = self._valid_payload([self._good_request("H010")])
        data = client.post("/api/v1/recommend/recipients", json=payload).json()
        for rec in data["recommendations"]:
            assert isinstance(rec["matchScore"], int)
            assert 0 <= rec["matchScore"] <= 100

