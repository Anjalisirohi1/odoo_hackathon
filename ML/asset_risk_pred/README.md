# AssetFlow — Asset Risk Prediction (ML Module)

This folder contains the complete, self-contained ML pipeline for AssetFlow's
Asset Risk Prediction feature — powering the **Risk column** on the Asset
Directory (Screen 4) and the **"Assets at Risk" KPI** on the Dashboard
(Screen 2).

It trains on the pre-generated `asset_risk_dataset.csv` (10,000 synthetic
assets) — no dataset generation happens here.

## Folder structure

```
ml/
    asset_risk_dataset.csv   # input data (already generated)
    preprocess.py            # shared feature engineering, used by train.py AND predict.py
    train.py                 # EDA + preprocessing + model comparison + training + evaluation
    predict.py                # loads saved artifacts, scores one asset, adds rule-based reason
    asset_risk_model.pkl     # saved model bundle (created by train.py)
    encoder.pkl               # saved categorical encoder bundle (created by train.py)
    requirements.txt
    README.md
```

## How to run

```bash
pip install -r requirements.txt

# 1. Train (runs EDA, compares models, saves artifacts)
python3 train.py

# 2. Predict on a sample asset (demo)
python3 predict.py
```

`predict.py` can also be imported as a library:

```python
from predict import predict_asset_risk

result = predict_asset_risk({
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
})
# -> {"risk_score": 0.927, "risk_label": "High",
#     "reason": "Frequent maintenance in the last year; High utilization and expired warranty"}
```

## EDA summary (from train.py's console output)

- **Shape:** 10,000 rows × 22 columns, no missing values.
- **Class distribution (risk_label):** Low 55% / Medium 30% / High 15% — matches
  the dataset's design target.
- **Correlation with risk_score:** `maintenance_count` (0.44), `asset_age_years`
  (0.37), `allocation_count` (0.29), `maintenance_cost` (0.24), and
  `utilization_ratio` (0.21) are the strongest linear correlates.
  `idle_days` is mildly negatively correlated (-0.14) — idle assets tend to be
  lower risk, since idling is a usage-context signal rather than a wear signal.
- These correlations line up with how the dataset was generated (maintenance
  history + condition were weighted heaviest), which is a good sanity check
  that the model will learn something meaningful rather than noise.

## Preprocessing

- **Missing values:** numeric columns imputed with median, categorical
  columns imputed with `"Unknown"` (none were actually missing in this
  dataset, but the pipeline handles it defensively for future/real data).
- **Date → numeric:** `purchase_date` is converted into
  `purchase_year`, `purchase_month`, `purchase_quarter`, and
  `days_since_purchase`. If a single asset is scored without a
  `purchase_date` (e.g. only `asset_age_years` is known), these are
  approximated from `asset_age_years` instead — the pipeline never breaks
  on a partial input.
- **Categorical encoding:** `asset_type`, `department`, `condition`, `status`
  are one-hot encoded (`OneHotEncoder(handle_unknown="ignore")`), fit once at
  training time and reused at prediction time via `encoder.pkl`.
- **Scaling:** **not applied to the production model.** The final model
  (Random Forest, tree-based) is scale-invariant, so no `scaler.pkl` is
  produced. A `StandardScaler` is used transiently, in-memory only, purely to
  give Logistic Regression a fair shot during the model comparison step in
  `train.py` — it is intentionally not saved as a deliverable.
- **Split:** 80/20 train/test, stratified on `risk_label` to preserve the
  55/30/15 class balance in both splits.

## Model selection

Two modeling tasks share the same feature matrix:

### 1. `risk_label` classification (comparison, for evaluation/insight)

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | 0.897 | 0.897 | 0.897 | 0.897 | 0.977 |
| XGBoost | 0.896 | 0.897 | 0.896 | 0.896 | 0.977 |
| Random Forest | 0.891 | 0.892 | 0.891 | 0.891 | 0.974 |
| Decision Tree | 0.868 | 0.873 | 0.868 | 0.869 | 0.952 |

All four are close; Logistic Regression edges out slightly here because
`risk_score` (and therefore `risk_label`) was built from a roughly linear
weighted combination of normalized features, which plays to Logistic
Regression's strength. Decision Tree trails the others (single-tree
variance/overfitting).

### 2. `risk_score` regression (the production model)

**Chosen: Random Forest Regressor** (150 trees, max depth 10, min 5 samples/leaf —
deliberately modest so the saved model stays small/fast for a hackathon; a
first pass with 400 trees / depth 14 hit ~150MB on disk for a 10k-row dataset
with no accuracy benefit, so it was scaled back).

- MAE: **0.051**, RMSE: **0.066**, R²: **0.934** on held-out test data.
- Deriving `risk_label` from the predicted `risk_score` (using the same
  0.40 / 0.70 cut points the dataset itself was labeled with) agrees with
  the true `risk_label` on **89.6%** of test rows — close to the standalone
  classifier's own accuracy, while guaranteeing the score and the label
  can never contradict each other in production.
- Saved `asset_risk_model.pkl` is **~2.9 MB** (joblib `compress=3`).

**Why Random Forest for the production model (not Logistic Regression,
Decision Tree, or XGBoost):**
- It's the natural choice for a **regression** target (`risk_score`), which
  is the real thing the UI needs (a continuous, sortable value for the
  Asset Directory and a thresholdable value for the KPI) — the label is
  just a derived view of it.
- Handles the mix of numeric + one-hot categorical features without extra
  preprocessing (no scaling required).
- Robust to the noisy, partly-synthetic relationships in this dataset;
  less prone to the single-tree overfitting a plain Decision Tree showed.
- Gives feature importances for free, which both validates the model
  (top features: `warranty_expired`, `condition_Excellent`,
  `utilization_ratio`, `condition_Poor`, `status_Retired`,
  `maintenance_count` — consistent with how the dataset was constructed)
  and cross-checks the rule-based `reason` logic in `predict.py`.
- XGBoost was evaluated (classifier comparison) but not adopted as the
  production model — it added a heavier dependency and only marginal
  metric gains over Random Forest, which isn't worth the extra complexity
  for an 8-hour hackathon scope.

### Design decision: why `risk_label` isn't served by the classifier directly

The classifier is trained and evaluated only to satisfy the standard model
comparison step and to sanity-check that a learnable pattern exists. In
**production, `predict.py` never calls the classifier** — it derives
`risk_label` deterministically from the regressor's `risk_score` using the
fixed thresholds in `preprocess.risk_label_from_score()`. This is the same
thresholding logic the original dataset was labeled with, so:
- The Risk badge color (Screen 4) and the numeric score sort order always
  agree.
- The "Assets at Risk" KPI count (Screen 2, `risk_label == "High"`) can never
  drift out of sync with what the Asset Directory displays for the same
  asset.

## Evaluation artifacts

Running `train.py` prints, for the classifier comparison:
- Accuracy, Precision, Recall, F1 for every candidate model
- ROC-AUC (one-vs-rest, weighted) for every candidate model
- Confusion Matrix and full Classification Report for the best-performing
  classifier

And for the regressor:
- MAE, RMSE, R²
- Top model-based feature importances

## The `reason` field

`reason` is **never** produced by a model. `predict.py`'s
`generate_reason()` applies simple, auditable business rules to the asset's
own raw feature values (maintenance frequency, days since last service,
utilization, warranty status, condition, age, status) — mirroring the same
logic used to label the original synthetic dataset, so explanations stay
consistent with what the model was actually trained to weight heavily.

## Retraining

Re-run `python3 train.py` any time `asset_risk_dataset.csv` is refreshed
with real production data (e.g. real maintenance/audit outcomes once
enough history accumulates) — it will re-fit the encoder and regressor from
scratch and overwrite `asset_risk_model.pkl` / `encoder.pkl`.
