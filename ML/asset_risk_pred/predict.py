"""
predict.py
==========
Prediction script for AssetFlow's Asset Risk Prediction module.

Loads the trained model + encoder artifacts and scores ONE asset at a time,
returning exactly the payload shape the backend expects for Screen 4's Risk
column / Screen 2's "Assets at Risk" KPI:

    {
        "risk_score": 0.91,
        "risk_label": "High",
        "reason": "Frequent maintenance and high utilization"
    }

IMPORTANT: "reason" is NEVER produced by the model. It is generated purely
from explainable, human-readable business rules applied to the asset's own
input features (see generate_reason() below) - this keeps the explanation
trustworthy and auditable, independent of any model internals.

Usage (as a library):
    from predict import predict_asset_risk
    result = predict_asset_risk(asset_dict)

Usage (as a script, runs a demo on a sample asset):
    python3 predict.py
"""

import json
import joblib
import numpy as np

import preprocess as pp

MODEL_PATH = "asset_risk_model.pkl"
ENCODER_PATH = "encoder.pkl"

# ------------------------------------------------------------------
# Load artifacts once at import time (cheap, keeps repeated calls fast -
# e.g. when the backend's batch job scores thousands of assets in a loop).
# ------------------------------------------------------------------
_model_bundle = joblib.load(MODEL_PATH)
_encoder_bundle = joblib.load(ENCODER_PATH)

_REGRESSOR = _model_bundle["regressor"]
_FEATURE_COLUMNS = _model_bundle["feature_columns"]
_ONEHOT_ENCODER = _encoder_bundle["onehot_encoder"]


# ------------------------------------------------------------------
# Rule-based "reason" generator
# ------------------------------------------------------------------
def generate_reason(asset: dict, risk_label: str) -> str:
    """
    Build a short, human-readable explanation from the asset's own raw
    feature values - NOT from the model. Mirrors the thresholds used when
    the training data itself was generated, so explanations stay
    consistent with what the model actually learned to weight heavily
    (maintenance history, condition, utilization, warranty status).
    """
    maintenance_count = asset.get("maintenance_count", 0)
    days_since_last_maintenance = asset.get("days_since_last_maintenance", 9999)
    utilization_ratio = asset.get("utilization_ratio", 0.0)
    warranty_expired = bool(asset.get("warranty_expired", False))
    condition = asset.get("condition", "Good")
    asset_age_years = asset.get("asset_age_years", 0.0)
    status = asset.get("status", "Available")

    high_maint = maintenance_count >= 4
    recent_service = (maintenance_count > 0) and (days_since_last_maintenance <= 60)
    high_util = utilization_ratio >= 0.65
    low_util = utilization_ratio <= 0.30
    old_asset = asset_age_years >= 5
    poor_cond = condition in ("Fair", "Poor")
    good_cond = condition in ("Excellent", "Good")

    if status == "Retired":
        return ("Retired asset with prior wear - no longer in active use"
                if (poor_cond or high_maint)
                else "Retired asset - no longer in active use")

    if risk_label == "High":
        reasons = []
        if high_maint:
            reasons.append("Frequent maintenance in the last year")
        if high_util and warranty_expired:
            reasons.append("High utilization and expired warranty")
        if old_asset and poor_cond:
            reasons.append("Old asset with poor condition")
        if not reasons:
            reasons.append("Expired warranty with declining condition" if warranty_expired
                            else "Multiple compounding risk factors")
        return "; ".join(reasons[:2])

    if risk_label == "Low":
        if recent_service and good_cond:
            return "Recently serviced and good condition"
        if low_util and condition == "Excellent":
            return "Low utilization and excellent condition"
        if not old_asset and maintenance_count == 0:
            return "New asset with no maintenance history"
        return "Well-maintained asset with minimal usage strain"

    # Medium
    parts = []
    if 1 <= maintenance_count <= 3:
        parts.append("Some maintenance history")
    if 0.30 < utilization_ratio < 0.65:
        parts.append("moderate usage")
    if warranty_expired and good_cond:
        parts.append("warranty expired but condition still acceptable")
    if not parts:
        parts.append("Mixed usage and maintenance signals")
    text = " and ".join(parts) if len(parts) <= 2 else "; ".join(parts)
    return text[0].upper() + text[1:]


# ------------------------------------------------------------------
# Main prediction function
# ------------------------------------------------------------------
def predict_asset_risk(asset: dict) -> dict:
    """
    Score a single asset.

    `asset` should be a dict with (at minimum) the raw feature fields used
    at training time, e.g.:
        {
            "asset_type": "Vehicle",
            "department": "Operations",
            "purchase_date": "2021-01-07",   # or omit and supply asset_age_years directly
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

    Returns:
        {"risk_score": float, "risk_label": str, "reason": str}
    """
    X = pp.preprocess_single_asset(asset, _ONEHOT_ENCODER)

    # Guarantee column order/shape matches training exactly, filling any
    # feature the encoder didn't produce for this row with 0.
    X = X.reindex(columns=_FEATURE_COLUMNS, fill_value=0)

    predicted_score = float(np.clip(_REGRESSOR.predict(X)[0], 0.0, 1.0))
    risk_label = pp.risk_label_from_score(predicted_score)
    reason = generate_reason(asset, risk_label)

    return {
        "risk_score": round(predicted_score, 3),
        "risk_label": risk_label,
        "reason": reason,
    }


# ------------------------------------------------------------------
# Demo / CLI entry point
# ------------------------------------------------------------------
if __name__ == "__main__":
    sample_asset = {
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

    result = predict_asset_risk(sample_asset)
    print(json.dumps(result, indent=4))
