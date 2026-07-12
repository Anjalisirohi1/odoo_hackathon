"""
preprocess.py
=============
Shared preprocessing logic for the AssetFlow Asset Risk Prediction pipeline.

This module is imported by BOTH train.py and predict.py so that a single
asset gets EXACTLY the same feature engineering at prediction time as the
training data did - the #1 source of bugs in ML pipelines is training/serving
skew, so we centralize the logic here instead of duplicating it.

Responsibilities:
    1. Load the raw dataset.
    2. Engineer numeric features from the date column.
    3. Build/apply the categorical encoder.
    4. Assemble the final numeric feature matrix used by the models.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, LabelEncoder

# ----------------------------------------------------------------------
# Columns used directly as numeric model inputs (already numeric in the
# source CSV, no transformation needed beyond type casting).
# ----------------------------------------------------------------------
RAW_NUMERIC_COLUMNS = [
    "asset_age_years",
    "purchase_cost",
    "allocation_count",
    "booking_count_last_12_months",
    "utilization_ratio",
    "maintenance_count",
    "maintenance_cost",
    "days_since_last_maintenance",
    "days_since_last_allocation",
    "idle_days",
]

# Boolean column, cast to 0/1
BOOLEAN_COLUMNS = ["warranty_expired"]

# Categorical columns that need encoding
CATEGORICAL_COLUMNS = ["asset_type", "department", "condition", "status"]

# Risk label ordering - used to keep the LabelEncoder's classes in a fixed,
# business-meaningful order (Low < Medium < High) rather than alphabetical.
RISK_LABEL_ORDER = ["Low", "Medium", "High"]

# The exact cut points used to build risk_label from risk_score in the
# source dataset. Kept here as a single source of truth so predict.py can
# derive a label from a predicted risk_score that is always internally
# consistent with the score itself.
RISK_LOW_MAX = 0.40
RISK_MEDIUM_MAX = 0.70


# ------------------------------------------------------------------
# 1. Load
# ------------------------------------------------------------------
def load_data(path: str) -> pd.DataFrame:
    """Load the raw AssetFlow risk dataset from CSV."""
    df = pd.read_csv(path)
    return df


# ------------------------------------------------------------------
# 2. Date -> numeric feature engineering
# ------------------------------------------------------------------
def engineer_date_features(df: pd.DataFrame, reference_date: str = "2026-07-12") -> pd.DataFrame:
    """
    Convert purchase_date into numeric features a model can use directly:
        - purchase_year
        - purchase_month
        - purchase_quarter
        - days_since_purchase (derived independently of asset_age_years,
          gives the model a second, finer-grained view of recency)

    Works whether purchase_date is present or not (predict.py callers may
    only supply asset_age_years for a single asset and skip this).
    """
    df = df.copy()
    if "purchase_date" in df.columns:
        ref = pd.Timestamp(reference_date)
        purchase_dt = pd.to_datetime(df["purchase_date"], errors="coerce")
        df["purchase_year"] = purchase_dt.dt.year
        df["purchase_month"] = purchase_dt.dt.month
        df["purchase_quarter"] = purchase_dt.dt.quarter
        df["days_since_purchase"] = (ref - purchase_dt).dt.days
        # Fallback for rows where purchase_date failed to parse: derive
        # from asset_age_years so we never introduce NaNs downstream.
        fallback_days = (df["asset_age_years"] * 365.25).round().astype("Int64")
        df["days_since_purchase"] = df["days_since_purchase"].fillna(fallback_days)
        df["purchase_year"] = df["purchase_year"].fillna(ref.year - df["asset_age_years"].round()).astype(int)
        df["purchase_month"] = df["purchase_month"].fillna(6).astype(int)
        df["purchase_quarter"] = df["purchase_quarter"].fillna(2).astype(int)
    else:
        # No date supplied (e.g. a single asset passed to predict.py) -
        # approximate purchase_year/month from asset_age_years so the
        # feature vector still has the same shape as at training time.
        ref = pd.Timestamp(reference_date)
        approx_days = (df["asset_age_years"] * 365.25).round()
        df["days_since_purchase"] = approx_days
        df["purchase_year"] = ref.year - (approx_days // 365).astype(int)
        df["purchase_month"] = 6   # neutral mid-year default when unknown
        df["purchase_quarter"] = 2

    return df


DATE_DERIVED_COLUMNS = ["purchase_year", "purchase_month", "purchase_quarter", "days_since_purchase"]

# Final ordered list of numeric columns fed into the models
NUMERIC_FEATURE_COLUMNS = RAW_NUMERIC_COLUMNS + DATE_DERIVED_COLUMNS + BOOLEAN_COLUMNS


# ------------------------------------------------------------------
# 3. Missing value handling
# ------------------------------------------------------------------
def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Impute missing values.
    Numeric columns -> median (robust to outliers, e.g. a few very old assets).
    Categorical columns -> a dedicated 'Unknown' category rather than the mode,
    so a missing category is never silently mistaken for a real one.
    """
    df = df.copy()
    for col in RAW_NUMERIC_COLUMNS + DATE_DERIVED_COLUMNS:
        if col in df.columns and df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())
    for col in CATEGORICAL_COLUMNS:
        if col in df.columns and df[col].isnull().any():
            df[col] = df[col].fillna("Unknown")
    for col in BOOLEAN_COLUMNS:
        if col in df.columns and df[col].isnull().any():
            df[col] = df[col].fillna(False)
    return df


# ------------------------------------------------------------------
# 4. Categorical encoding
# ------------------------------------------------------------------
def fit_categorical_encoder(df: pd.DataFrame) -> OneHotEncoder:
    """Fit a OneHotEncoder on the categorical columns (training time only)."""
    encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    encoder.fit(df[CATEGORICAL_COLUMNS])
    return encoder


def apply_categorical_encoder(df: pd.DataFrame, encoder: OneHotEncoder) -> pd.DataFrame:
    """Transform categorical columns using an already-fitted encoder."""
    encoded = encoder.transform(df[CATEGORICAL_COLUMNS])
    encoded_cols = encoder.get_feature_names_out(CATEGORICAL_COLUMNS)
    return pd.DataFrame(encoded, columns=encoded_cols, index=df.index)


def fit_label_encoder() -> LabelEncoder:
    """
    Build a LabelEncoder for risk_label with a FIXED business order
    (Low=0, Medium=1, High=2) instead of alphabetical, so downstream
    ROC-AUC / ordering logic behaves intuitively.
    """
    le = LabelEncoder()
    le.fit(RISK_LABEL_ORDER)
    return le


# ------------------------------------------------------------------
# 5. Full feature matrix assembly
# ------------------------------------------------------------------
def build_feature_matrix(df: pd.DataFrame, encoder: OneHotEncoder):
    """
    Given a raw (already date-engineered, missing-value-handled) dataframe
    and a fitted categorical encoder, return the final numeric feature
    matrix X (pandas DataFrame) ready for model.fit / model.predict.
    """
    numeric_part = df[NUMERIC_FEATURE_COLUMNS].astype(float)
    categorical_part = apply_categorical_encoder(df, encoder)
    X = pd.concat([numeric_part.reset_index(drop=True), categorical_part.reset_index(drop=True)], axis=1)
    return X


def full_preprocess_for_training(df: pd.DataFrame):
    """
    Convenience wrapper used by train.py:
        raw df -> date features -> missing value handling -> fitted encoder
        -> X (features), y_score (risk_score), y_label_encoded, label_encoder, encoder
    """
    df = engineer_date_features(df)
    df = handle_missing_values(df)

    encoder = fit_categorical_encoder(df)
    label_encoder = fit_label_encoder()

    X = build_feature_matrix(df, encoder)
    y_score = df["risk_score"].astype(float).values
    y_label = label_encoder.transform(df["risk_label"])

    return X, y_score, y_label, encoder, label_encoder


def preprocess_single_asset(asset_dict: dict, encoder: OneHotEncoder) -> pd.DataFrame:
    """
    Convenience wrapper used by predict.py: takes a single asset described
    as a plain Python dict (raw, human-entered field values) and returns a
    single-row feature matrix in the exact same shape/order the model was
    trained on.
    """
    df = pd.DataFrame([asset_dict])
    df = engineer_date_features(df)
    df = handle_missing_values(df)
    X = build_feature_matrix(df, encoder)
    return X


def risk_label_from_score(score: float) -> str:
    """
    Deterministically derive the risk_label bucket from a risk_score using
    the SAME thresholds the original dataset was labeled with. Using this
    (rather than a separately-trained classifier's own label prediction)
    guarantees the score shown in the UI and the label badge color can
    never contradict each other - critical since Screen 4's Risk badge and
    Screen 2's "Assets at Risk" KPI both depend on this same cut.
    """
    if score < RISK_LOW_MAX:
        return "Low"
    elif score < RISK_MEDIUM_MAX:
        return "Medium"
    return "High"
