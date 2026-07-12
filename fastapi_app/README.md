# AssetFlow Screen 9 ML API

FastAPI wrapper around the trained models (predictive maintenance, idle
detection) plus the precomputed analytics bundle, for your backend teammate
to call directly.

## Setup

```bash
cd fastapi_app
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then open **http://127.0.0.1:8000/docs** — interactive Swagger UI where you
can test every endpoint by hand (click "Try it out" on any route).

## Folder structure

```
fastapi_app/
├── main.py                     # the FastAPI app
├── requirements.txt
├── models/
│   ├── maintenance_model.joblib
│   ├── idle_detector.joblib
│   └── maintenance_model_columns.json   # exact feature column order
└── data/
    ├── categories.csv          # for validating category_id
    └── screen9_analytics.json  # precomputed dashboard data
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Check the service is up and models loaded |
| POST | `/predict/maintenance-risk` | Predict maintenance risk score (0-100) for one asset |
| POST | `/predict/idle-check` | Check if one asset looks idle |
| POST | `/score/retirement` | Compute retirement/replacement score for one asset |
| GET | `/analytics/screen9` | Full precomputed dashboard bundle (fastest option — no per-asset calls needed) |
| GET | `/analytics/screen9/idle-assets` | Just the idle assets list |
| GET | `/analytics/screen9/retirement-candidates` | Just the retirement candidates list |
| GET | `/analytics/screen9/booking-heatmap` | Just the booking heatmap |
| GET | `/analytics/screen9/department-utilization` | Just department utilization |

## Recommended approach for the hackathon

**Use `/analytics/screen9` for the dashboard views** (idle list, retirement
candidates, heatmap, department chart) — this is the precomputed JSON, so it's
instant and doesn't depend on the model files at all.

**Use `/predict/maintenance-risk`, `/predict/idle-check`, `/score/retirement`
only if you need live scoring** for a *new* asset that isn't in the original
dataset yet (e.g. someone just added a new asset through the app and you want
its risk score immediately, without retraining).

## Example request

```bash
curl -X POST http://127.0.0.1:8000/predict/maintenance-risk \
  -H "Content-Type: application/json" \
  -d '{
    "asset_tag": "AF-9999",
    "acquisition_date": "2023-04-12",
    "acquisition_cost": 250000.0,
    "condition": "Good",
    "category_id": "C-004",
    "is_bookable": 1,
    "recent_usage_total": 4,
    "overdue_count": 1
  }'
```

Response:
```json
{
  "asset_tag": "AF-9999",
  "maintenance_risk_score": 42.3,
  "predicted_maintenance_count": 2.15
}
```

## Notes

- Valid `category_id` values come from your `categories.csv` (currently
  C-001 through C-006). The API returns a 400 error listing valid options if
  you send an unrecognized one.
- Valid `condition` values: `Excellent`, `Good`, `Fair`, `Poor`.
- CORS is wide open (`allow_origins=["*"]`) for local development — tighten
  this to your actual frontend URL before any real deployment.
- If you retrain the models later on updated data, just drop the new
  `.joblib` and `maintenance_model_columns.json` files into `models/` — no
  code changes needed, as long as the feature set stays the same.
