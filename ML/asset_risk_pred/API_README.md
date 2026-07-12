# AssetFlow — Asset Risk Prediction API

A thin FastAPI wrapper around the already-trained Asset Risk Prediction
model. This service does **not** train, retrain, or modify the model — it
only loads the existing artifacts once and serves predictions over HTTP so
the backend team can integrate without touching any ML code.

It powers:
- **Screen 4 (Asset Directory)** — the Risk column for each asset (call
  `/predict` once per asset, or in a loop for a list view).
- **Screen 2 (Dashboard KPI)** — "Assets at Risk" is simply a count of
  assets whose `risk_label` came back `"High"`; there is no separate model
  or endpoint for the KPI, the backend derives it from the same
  `/predict` responses.

## Project structure

```
ml/
    asset_risk_dataset.csv    # training data (unchanged)
    preprocess.py             # shared feature engineering (unchanged)
    train.py                  # training script (unchanged)
    predict.py                 # predict_asset_risk() - the ML pipeline (unchanged)
    asset_risk_model.pkl      # trained model bundle (unchanged)
    encoder.pkl                # categorical encoder bundle (unchanged)
    api.py                     # <-- NEW: FastAPI app (this deployment layer)
    requirements.txt           # updated: adds fastapi/uvicorn/pydantic
    README.md                  # ML pipeline documentation (unchanged)
    API_README.md              # <-- NEW: this file
```

`api.py` only ever calls `predict_asset_risk()` from `predict.py`. It does
not reimplement, wrap, or alter any preprocessing, feature engineering,
thresholds, or model logic.

## Installation

```bash
cd ml
pip install -r requirements.txt
```

> **Note:** `scikit-learn` is pinned to `1.7.1` to match the version the
> model was trained/pickled with. Loading the `.pkl` files with a
> different sklearn version will still work but prints an
> `InconsistentVersionWarning` — pinning avoids that noise and any risk of
> subtly different behavior.

## Running the API

```bash
uvicorn api:app --reload
```

The model and encoder are loaded into memory **once**, when the process
starts (via `predict.py`'s module-level load, triggered by `api.py`'s
import statement) — not on every request.

- API base URL: `http://localhost:8000`
- Interactive Swagger docs: `http://localhost:8000/docs`
- ReDoc docs: `http://localhost:8000/redoc`

## Endpoints

### `GET /`

Health check. Confirms the service is up.

**Response**
```json
{
    "status": "running",
    "service": "AssetFlow Asset Risk Prediction API",
    "version": "1.0"
}
```

### `POST /predict`

Scores a single asset and returns its risk score, label, and explanation.

**Request body** (all fields required; validated by Pydantic)

| Field | Type | Notes |
|---|---|---|
| `asset_type` | string | e.g. `"Laptop"`, `"Vehicle"`, `"Printer"` |
| `department` | string | e.g. `"IT"`, `"Operations"` |
| `purchase_date` | string | ISO date, e.g. `"2021-01-07"` |
| `asset_age_years` | float | ≥ 0 |
| `purchase_cost` | float | ≥ 0 |
| `condition` | string | `"Excellent"` \| `"Good"` \| `"Fair"` \| `"Poor"` |
| `status` | string | `"Available"` \| `"Allocated"` \| `"Under Maintenance"` \| `"Reserved"` \| `"Retired"` |
| `allocation_count` | integer | ≥ 0 |
| `booking_count_last_12_months` | integer | ≥ 0 |
| `utilization_ratio` | float | 0–1 |
| `maintenance_count` | integer | ≥ 0 |
| `maintenance_cost` | float | ≥ 0 |
| `days_since_last_maintenance` | integer | ≥ 0 |
| `days_since_last_allocation` | integer | ≥ 0 |
| `idle_days` | integer | ≥ 0 |
| `warranty_expired` | boolean | |

**Sample request**
```json
{
    "asset_type": "Vehicle",
    "department": "Operations",
    "purchase_date": "2021-01-07",
    "asset_age_years": 5.51,
    "purchase_cost": 21500.00,
    "condition": "Poor",
    "status": "Allocated",
    "allocation_count": 6,
    "booking_count_last_12_months": 1,
    "utilization_ratio": 0.657,
    "maintenance_count": 4,
    "maintenance_cost": 900.0,
    "days_since_last_maintenance": 33,
    "days_since_last_allocation": 13,
    "idle_days": 59,
    "warranty_expired": true
}
```

**Sample response** (`200 OK`)
```json
{
    "risk_score": 0.927,
    "risk_label": "High",
    "reason": "Frequent maintenance in the last year; High utilization and expired warranty"
}
```

**Error responses**

| Status | When |
|---|---|
| `422 Unprocessable Entity` | A field is missing, the wrong type, or out of range (e.g. negative `asset_age_years`, `utilization_ratio` > 1). Response body: `{"detail": "<field>: <reason>"}`. |
| `500 Internal Server Error` | An unexpected error inside the prediction pipeline itself. Response body: `{"detail": "Prediction failed: <error>"}`. |

## Consuming the API

### Python (`requests`)

```python
import requests

url = "http://localhost:8000/predict"
payload = {
    "asset_type": "Vehicle",
    "department": "Operations",
    "purchase_date": "2021-01-07",
    "asset_age_years": 5.51,
    "purchase_cost": 21500.00,
    "condition": "Poor",
    "status": "Allocated",
    "allocation_count": 6,
    "booking_count_last_12_months": 1,
    "utilization_ratio": 0.657,
    "maintenance_count": 4,
    "maintenance_cost": 900.0,
    "days_since_last_maintenance": 33,
    "days_since_last_allocation": 13,
    "idle_days": 59,
    "warranty_expired": True,
}

response = requests.post(url, json=payload)
response.raise_for_status()  # raises on 4xx/5xx
result = response.json()

print(result["risk_score"], result["risk_label"], result["reason"])
```

### JavaScript (`fetch`)

```javascript
const url = "http://localhost:8000/predict";

const payload = {
  asset_type: "Vehicle",
  department: "Operations",
  purchase_date: "2021-01-07",
  asset_age_years: 5.51,
  purchase_cost: 21500.00,
  condition: "Poor",
  status: "Allocated",
  allocation_count: 6,
  booking_count_last_12_months: 1,
  utilization_ratio: 0.657,
  maintenance_count: 4,
  maintenance_cost: 900.0,
  days_since_last_maintenance: 33,
  days_since_last_allocation: 13,
  idle_days: 59,
  warranty_expired: true,
};

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const err = await response.json();
  throw new Error(`Prediction failed: ${err.detail}`);
}

const result = await response.json();
console.log(result.risk_score, result.risk_label, result.reason);
```

### Suggested backend integration pattern

- **Screen 4 (Asset Directory):** call `/predict` per asset (on load, or
  lazily on scroll/pagination) and store `risk_label` next to each row as
  the badge color source; `risk_score` can drive sort order within the
  column.
- **Screen 2 (Dashboard KPI):** after fetching risk for the asset list,
  count entries where `risk_label == "High"` — no separate call needed.
- For bulk scoring (e.g. nightly refresh of the whole Asset Directory),
  loop over assets and call `/predict` for each; the model is already
  loaded in memory, so per-call latency is just inference time, not model
  load time.

## Notes for the backend team

- This API is intentionally single-purpose: one endpoint, one
  responsibility. No auth, rate-limiting, or persistence is included here
  — the ERP backend should handle authentication, and can put this
  service behind its own internal network / gateway as appropriate for
  the hackathon's deployment setup.
- `reason` is **not** produced by the model — it's generated by
  rule-based logic in `predict.py` from the asset's own input fields. It
  will always be consistent with `risk_label` but should be treated as
  explanatory text, not a machine-learned output.
- `risk_label` is deterministically derived from `risk_score` using fixed
  thresholds (`< 0.40` = Low, `0.40–0.69` = Medium, `≥ 0.70` = High), so
  the Directory badge and the KPI count can never disagree for the same
  asset.
- If `asset_risk_model.pkl` / `encoder.pkl` are ever retrained (see the
  main `README.md`), no changes are needed here — `api.py` always loads
  whatever is currently on disk at those paths.
