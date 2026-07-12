"""
train.py
========
End-to-end training pipeline for AssetFlow's Asset Risk Prediction module.

Run:
    python3 train.py

What it does, in order:
    1. Load asset_risk_dataset.csv
    2. Exploratory Data Analysis (printed to console)
    3. Preprocessing (dates -> numeric, missing values, categorical encoding)
    4. Train/test split (80/20, stratified on risk_label)
    5. Compare candidate classifiers for risk_label
    6. Train the chosen regressor for risk_score
    7. Evaluate both models
    8. Save: asset_risk_model.pkl, encoder.pkl

Design decision (see README.md for the full rationale):
    - risk_score is predicted by a REGRESSION model (continuous 0-1 target).
    - The final risk_label shown to users is derived from that predicted
      risk_score using the same fixed thresholds the dataset was built
      with (see preprocess.risk_label_from_score). This guarantees the
      score and the label can never disagree.
    - We ALSO train and evaluate a dedicated classifier for risk_label as
      requested, to compare algorithms and report standard classification
      metrics - but the classifier is used for evaluation/insight, not for
      the production label (avoids two models silently disagreeing).
"""

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score,
    mean_absolute_error, mean_squared_error, r2_score,
)

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

import preprocess as pp

DATA_PATH = r"C:\Users\anjal\ML_odoo\Asset_risk_pred\data\asset_risk_dataset.csv"
MODEL_PATH = "asset_risk_model.pkl"
ENCODER_PATH = "encoder.pkl"
RANDOM_STATE = 42


# ========================================================================
# 1. LOAD
# ========================================================================
def run_eda(df: pd.DataFrame) -> None:
    print("=" * 70)
    print("EXPLORATORY DATA ANALYSIS")
    print("=" * 70)

    print(f"\nDataset shape: {df.shape[0]} rows x {df.shape[1]} columns")

    print("\n--- Data types ---")
    print(df.dtypes)

    print("\n--- Missing values ---")
    missing = df.isnull().sum()
    print(missing[missing > 0] if missing.sum() > 0 else "No missing values found.")

    print("\n--- risk_label class distribution ---")
    print(df["risk_label"].value_counts())
    print(df["risk_label"].value_counts(normalize=True).round(3))

    print("\n--- Summary statistics (numeric columns) ---")
    print(df[pp.RAW_NUMERIC_COLUMNS + ["risk_score"]].describe().round(2))

    print("\n--- Correlation with risk_score (numeric features) ---")
    corr = df[pp.RAW_NUMERIC_COLUMNS + ["risk_score"]].corr()["risk_score"].sort_values(ascending=False)
    print(corr.round(3))

    print(
        "\n--- Feature importance discussion (pre-modeling, based on correlation) ---\n"
        "maintenance_count, days_since_last_maintenance and condition-linked\n"
        "signals show the strongest correlation with risk_score, matching how\n"
        "the dataset was constructed (maintenance history + condition were\n"
        "weighted heaviest). asset_age_years and warranty_expired contribute\n"
        "moderately. idle_days / days_since_last_allocation are comparatively\n"
        "weak on their own - they mainly help distinguish 'rarely needed asset'\n"
        "from 'broken asset', rather than driving risk directly. This is\n"
        "revisited with actual model-based feature importances after training."
    )
    print()


# ========================================================================
# 2. CLASSIFIER COMPARISON (for risk_label - evaluation / model selection)
# ========================================================================
def compare_classifiers(X_train, X_test, y_train, y_test, label_encoder):
    """
    Train and compare candidate classifiers for risk_label.
    Logistic Regression needs scaled features; tree-based models do not.
    Returns a results dict and the best-performing fitted model.
    """
    results = {}
    fitted_models = {}

    # Logistic Regression needs scaling - fit a LOCAL scaler just for this
    # comparison run. It is intentionally NOT saved as a deliverable
    # because the final chosen model (Random Forest) does not need it.
    local_scaler = StandardScaler()
    X_train_scaled = local_scaler.fit_transform(X_train)
    X_test_scaled = local_scaler.transform(X_test)

    candidates = {
        "Logistic Regression": (LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
                                 X_train_scaled, X_test_scaled),
        "Decision Tree": (DecisionTreeClassifier(max_depth=8, random_state=RANDOM_STATE),
                           X_train, X_test),
        "Random Forest": (RandomForestClassifier(n_estimators=300, max_depth=12,
                                                   random_state=RANDOM_STATE, n_jobs=-1),
                           X_train, X_test),
    }
    if XGBOOST_AVAILABLE:
        candidates["XGBoost"] = (
            XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.1,
                           random_state=RANDOM_STATE, eval_metric="mlogloss"),
            X_train, X_test,
        )

    print("=" * 70)
    print("CLASSIFIER COMPARISON (target: risk_label)")
    print("=" * 70)

    for name, (model, xtr, xte) in candidates.items():
        model.fit(xtr, y_train)
        y_pred = model.predict(xte)

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

        try:
            y_proba = model.predict_proba(xte)
            roc_auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")
        except Exception:
            roc_auc = None

        results[name] = dict(accuracy=acc, precision=prec, recall=rec, f1=f1, roc_auc=roc_auc)
        fitted_models[name] = (model, xte)

        print(f"\n[{name}]")
        print(f"  Accuracy : {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall   : {rec:.4f}")
        print(f"  F1 Score : {f1:.4f}")
        if roc_auc is not None:
            print(f"  ROC-AUC  : {roc_auc:.4f}")

    print("\n--- Comparison summary (sorted by F1) ---")
    summary_df = pd.DataFrame(results).T.sort_values("f1", ascending=False)
    print(summary_df.round(4))

    best_name = summary_df.index[0]
    best_model, best_xte = fitted_models[best_name]
    print(f"\nSelected classifier: {best_name}")

    # Detailed report for the winning model
    y_pred_best = best_model.predict(best_xte)
    print(f"\n--- Confusion Matrix ({best_name}) ---")
    print(confusion_matrix(y_test, y_pred_best))
    print(f"\n--- Classification Report ({best_name}) ---")
    print(classification_report(y_test, y_pred_best, target_names=label_encoder.classes_))

    return best_name, results


# ========================================================================
# 3. REGRESSOR (production model for risk_score)
# ========================================================================
def train_regressor(X_train, X_test, y_train, y_test):
    print("=" * 70)
    print("REGRESSOR (target: risk_score) - production model")
    print("=" * 70)

    # n_estimators/max_depth are deliberately modest: a hackathon-scale
    # dataset (10k rows) does not need hundreds of deep trees, and keeping
    # the forest smaller keeps the saved .pkl file small and fast to load.
    # min_samples_leaf further caps tree size and reduces overfitting.
    reg = RandomForestRegressor(
        n_estimators=150, max_depth=10, min_samples_leaf=5,
        random_state=RANDOM_STATE, n_jobs=-1,
    )
    reg.fit(X_train, y_train)
    y_pred = reg.predict(X_test)
    y_pred = np.clip(y_pred, 0.0, 1.0)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"MAE : {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R^2 : {r2:.4f}")

    # Downstream label check: how often does threshold(predicted_score)
    # agree with the true risk_label? This validates the "derive label
    # from predicted score" design decision end-to-end.
    predicted_labels = [pp.risk_label_from_score(s) for s in y_pred]
    return reg, predicted_labels


# ========================================================================
# 4. MAIN
# ========================================================================
def main():
    print("Loading dataset...")
    df = pp.load_data(DATA_PATH)

    run_eda(df)

    print("Preprocessing (date features, missing values, encoding)...")
    X, y_score, y_label, encoder, label_encoder = pp.full_preprocess_for_training(df)
    print(f"Final feature matrix shape: {X.shape}")

    # Single split reused for both tasks so comparisons are apples-to-apples
    (X_train, X_test,
     y_score_train, y_score_test,
     y_label_train, y_label_test) = train_test_split(
        X, y_score, y_label,
        test_size=0.20, random_state=RANDOM_STATE, stratify=y_label,
    )
    print(f"Train size: {X_train.shape[0]} | Test size: {X_test.shape[0]}")

    best_clf_name, clf_results = compare_classifiers(
        X_train, X_test, y_label_train, y_label_test, label_encoder
    )

    regressor, predicted_labels_from_score = train_regressor(
        X_train, X_test, y_score_train, y_score_test
    )

    true_labels_test = label_encoder.inverse_transform(y_label_test)
    agreement = np.mean(np.array(predicted_labels_from_score) == np.array(true_labels_test))
    print(f"\nLabel derived from predicted risk_score matches true risk_label: {agreement:.2%} of test rows")

    print("\n--- Model-based feature importances (Random Forest regressor) ---")
    importances = pd.Series(regressor.feature_importances_, index=X.columns).sort_values(ascending=False)
    print(importances.head(12).round(4))

    # --------------------------------------------------------------
    # Save artifacts
    # --------------------------------------------------------------
    model_bundle = {
        "regressor": regressor,                 # production model -> risk_score
        "best_classifier_name": best_clf_name,   # informational only
        "classifier_comparison_results": clf_results,
        "feature_columns": list(X.columns),
        "label_encoder": label_encoder,
        "trained_on_rows": len(df),
    }
    joblib.dump(model_bundle, MODEL_PATH, compress=3)
    print(f"\nSaved model bundle -> {MODEL_PATH}")

    encoder_bundle = {
        "onehot_encoder": encoder,
        "categorical_columns": pp.CATEGORICAL_COLUMNS,
        "numeric_columns": pp.NUMERIC_FEATURE_COLUMNS,
    }
    joblib.dump(encoder_bundle, ENCODER_PATH)
    print(f"Saved encoder bundle -> {ENCODER_PATH}")

    # NOTE: no scaler.pkl is saved. The production model (RandomForestRegressor)
    # is tree-based and does not require feature scaling. A StandardScaler
    # was used ONLY transiently inside compare_classifiers() to give Logistic
    # Regression a fair comparison, and is intentionally not persisted.
    print("\nNo scaler.pkl saved: the chosen production model (Random Forest) "
          "does not require feature scaling.")

    print("\nTraining complete.")


if __name__ == "__main__":
    main()



