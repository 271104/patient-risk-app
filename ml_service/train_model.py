"""
Trains two models on patient_cost_risk_dataset.csv:
  1. Ridge Regression -> predicts medical_cost
  2. Decision Tree Classifier -> predicts risk_category

Both are wrapped in sklearn Pipelines (preprocessing + model) and saved
with joblib so the FastAPI service can load and call them directly.
"""
import numpy as np
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import Ridge
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.metrics import accuracy_score, f1_score, classification_report

DATA_PATH = "D:\Machine Learning\Project\patient-risk-app\patient_cost_risk_dataset.csv"

CATEGORICAL = [
    "gender", "region", "smoker", "alcohol_consumption", "diabetes",
    "hypertension", "heart_disease", "chronic_kidney_disease",
    "cancer_history", "admission_type", "insurance_type",
]
NUMERIC = [
    "age", "bmi", "exercise_freq_per_week", "systolic_bp", "cholesterol",
    "blood_sugar", "num_prior_admissions", "num_prior_surgeries",
    "length_of_stay_days",
]
FEATURES = CATEGORICAL + NUMERIC

df = pd.read_csv(DATA_PATH)

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
        ("num", StandardScaler(), NUMERIC),
    ]
)

# ---------------------------------------------------------------------
# 1. Ridge Regression -> medical_cost (log-transformed target)
# ---------------------------------------------------------------------
X = df[FEATURES]
y_cost = np.log1p(df["medical_cost"])  # log-transform since cost is right-skewed

X_train, X_test, y_train, y_test = train_test_split(
    X, y_cost, test_size=0.2, random_state=42
)

cost_pipeline = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("ridge", Ridge(alpha=1.0, random_state=42)),
])
cost_pipeline.fit(X_train, y_train)

pred_log = cost_pipeline.predict(X_test)
pred = np.expm1(pred_log)
actual = np.expm1(y_test)
print("=== Ridge Regression (medical_cost) ===")
print("MAE :", round(mean_absolute_error(actual, pred), 2))
print("RMSE:", round(np.sqrt(mean_squared_error(actual, pred)), 2))
print("R2  :", round(r2_score(actual, pred), 4))

joblib.dump(cost_pipeline, "models/cost_ridge_pipeline.joblib")

# ---------------------------------------------------------------------
# 2. Decision Tree Classifier -> risk_category
# ---------------------------------------------------------------------
y_risk = df["risk_category"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y_risk, test_size=0.2, random_state=42, stratify=y_risk
)

risk_pipeline = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("tree", DecisionTreeClassifier(
        max_depth=8, min_samples_leaf=25, class_weight="balanced", random_state=42
    )),
])
risk_pipeline.fit(X_train, y_train)

pred_risk = risk_pipeline.predict(X_test)
print("\n=== Decision Tree Classifier (risk_category) ===")
print("Accuracy :", round(accuracy_score(y_test, pred_risk), 4))
print("Macro F1 :", round(f1_score(y_test, pred_risk, average="macro"), 4))
print(classification_report(y_test, pred_risk))

joblib.dump(risk_pipeline, "models/risk_tree_pipeline.joblib")

print("\nSaved models to ml_service/models/")
