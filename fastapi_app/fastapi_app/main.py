

import json
from pathlib import Path
from datetime import datetime
from typing import Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

app = FastAPI(
    title="AssetFlow Screen 9 ML API",
    description="Predictive maintenance, idle detection, and analytics for AssetFlow",
    version="1.0.0",
)

# Allow the frontend (running on a different port/origin during dev) to call this API.
# Tighten allow_origins to your actual frontend URL before deploying.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load models and metadata once at startup
# ---------------------------------------------------------------------------
maintenance_model = joblib.load(MODELS_DIR / "maintenance_model.joblib")
idle_detector = joblib.load(MODELS_DIR / "idle_detector.joblib")

with open(MODELS_DIR / "maintenance_model_columns.json") as f:
    MODEL_COLUMNS = json.load(f)  # exact column order the model expects

categories_df = pd.read_csv(DATA_DIR / "categories.csv")
VALID_CATEGORY_IDS = set(categories_df["category_id"])

with open(DATA_DIR / "screen9_analytics.json") as f:
    PRECOMPUTED_ANALYTICS = json.load(f)

CONDITION_MAP = {"Excellent": 0, "Good": 1, "Fair": 2, "Poor": 3}


# ---------------------------------------------------------------------------
# Request/response schemas
# ---------------------------------------------------------------------------
class AssetFeatures(BaseModel):
    """Raw fields describing a single asset, as your backend would have them."""
    asset_tag: str = Field(..., example="AF-0272")
    acquisition_date: str = Field(..., example="2023-04-12", description="YYYY-MM-DD")
    acquisition_cost: float = Field(..., example=250000.0)
    condition: str = Field(..., example="Good", description="Excellent | Good | Fair | Poor")
    category_id: str = Field(..., example="C-004", description="Must match a category_id in categories.csv")
    is_bookable: int = Field(..., example=1, description="0 or 1")
    recent_usage_total: int = Field(0, example=4, description="Allocations + bookings in the last 180 days")
    maintenance_count: int = Field(0, example=3, description="Total historical maintenance events for this asset")
    overdue_count: int = Field(0, example=1, description="Total historical overdue allocations")
    days_since_last_activity: Optional[int] = Field(
        None, example=30, description="Days since last allocation/booking. Required for idle check."
    )


class MaintenanceRiskResponse(BaseModel):
    asset_tag: str
    maintenance_risk_score: float
    predicted_maintenance_count: float


class IdleCheckResponse(BaseModel):
    asset_tag: str
    is_idle: bool


class RetirementScoreResponse(BaseModel):
    asset_tag: str
    retirement_score: float
    retirement_flag: bool


# ---------------------------------------------------------------------------
# Feature engineering helpers (must mirror training exactly)
# ---------------------------------------------------------------------------
def _age_years(acquisition_date: str) -> float:
    acq = datetime.strptime(acquisition_date, "%Y-%m-%d")
    return (datetime.now() - acq).days / 365


def _build_maintenance_feature_row(asset: AssetFeatures) -> pd.DataFrame:
    if asset.category_id not in VALID_CATEGORY_IDS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown category_id '{asset.category_id}'. Valid: {sorted(VALID_CATEGORY_IDS)}",
        )
    if asset.condition not in CONDITION_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown condition '{asset.condition}'. Valid: {list(CONDITION_MAP.keys())}",
        )

    row = {col: 0 for col in MODEL_COLUMNS}
    row["age_years"] = _age_years(asset.acquisition_date)
    row["acquisition_cost"] = asset.acquisition_cost
    row["condition_score"] = CONDITION_MAP[asset.condition]
    row["recent_usage_total"] = asset.recent_usage_total
    row["overdue_count"] = asset.overdue_count
    row["is_bookable"] = asset.is_bookable

    cat_col = f"cat_{asset.category_id}"
    if cat_col in row:
        row[cat_col] = 1

    return pd.DataFrame([row], columns=MODEL_COLUMNS)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": True}


@app.post("/predict/maintenance-risk", response_model=MaintenanceRiskResponse)
def predict_maintenance_risk(asset: AssetFeatures):
    """
    Predicts expected maintenance frequency for an asset and returns a
    0-100 risk score. Score is normalized against the score range seen
    during training, so very extreme new inputs may land outside 0-100
    (the score is clipped to that range for display purposes).
    """
    X = _build_maintenance_feature_row(asset)
    predicted_count = float(maintenance_model.predict(X)[0])

    # normalize using the actual min/max the training data produced
    # (from real_data training run - see maintenance_model training notebook)
    train_min, train_max = 0.307, 4.611
    risk_score = (predicted_count - train_min) / (train_max - train_min + 1e-9) * 100
    risk_score = max(0.0, min(100.0, risk_score))

    return MaintenanceRiskResponse(
        asset_tag=asset.asset_tag,
        maintenance_risk_score=round(risk_score, 1),
        predicted_maintenance_count=round(predicted_count, 2),
    )


@app.post("/predict/idle-check", response_model=IdleCheckResponse)
def predict_idle_check(asset: AssetFeatures):
    """
    Flags whether an asset looks idle, using the same multivariate
    IsolationForest trained on (recent_usage_total, days_since_last_activity).
    """
    if asset.days_since_last_activity is None:
        raise HTTPException(
            status_code=400,
            detail="days_since_last_activity is required for the idle check.",
        )

    X = pd.DataFrame(
        [[asset.recent_usage_total, asset.days_since_last_activity]],
        columns=["recent_usage_total", "days_since_last_activity"],
    )
    prediction = idle_detector.predict(X)[0]  # -1 = idle/outlier, 1 = normal
    return IdleCheckResponse(asset_tag=asset.asset_tag, is_idle=bool(prediction == -1))


@app.post("/score/retirement", response_model=RetirementScoreResponse)
def score_retirement(asset: AssetFeatures):
    """
    Retirement score is a lightweight weighted composite (not a trained
    model) so it's computed directly here rather than loaded from disk.
    Mirrors the same weights used in the training notebook.
    """
    age_years = _age_years(asset.acquisition_date)
    condition_score = CONDITION_MAP.get(asset.condition, 1)

    # Bounds below match the actual min/max seen in the training dataset
    # (real_data run). Update these if you retrain on a materially
    # different dataset later.
    def norm(value, lo, hi):
        return max(0.0, min(1.0, (value - lo) / (hi - lo + 1e-9)))

    score = (
        0.35 * norm(age_years, 0, 6.03)
        + 0.30 * norm(asset.maintenance_count, 0, 10)
        + 0.25 * norm(condition_score, 0, 3)
        + 0.10 * norm(asset.overdue_count, 0, 5)
    ) * 100

    return RetirementScoreResponse(
        asset_tag=asset.asset_tag,
        retirement_score=round(score, 1),
        retirement_flag=score >= 65,
    )


@app.get("/analytics/screen9")
def get_screen9_analytics():
    """
    Returns the full precomputed Screen 9 analytics bundle: maintenance
    risk rankings, idle assets, retirement candidates, booking heatmap,
    department utilization, and most-used assets. This is the fastest
    path for the frontend - no per-asset calls needed, just this once.
    """
    return PRECOMPUTED_ANALYTICS


@app.get("/analytics/screen9/idle-assets")
def get_idle_assets():
    return PRECOMPUTED_ANALYTICS["idle_assets"]


@app.get("/analytics/screen9/retirement-candidates")
def get_retirement_candidates():
    return PRECOMPUTED_ANALYTICS["retirement_candidates"]


@app.get("/analytics/screen9/booking-heatmap")
def get_booking_heatmap():
    return PRECOMPUTED_ANALYTICS["booking_heatmap"]


@app.get("/analytics/screen9/department-utilization")
def get_department_utilization():
    return PRECOMPUTED_ANALYTICS["department_utilization"]
