"""
FastAPI service serving both trained models:
  POST /predict  -> { risk_category, risk_probabilities, medical_cost }

Run with:
    uvicorn app:app --reload --port 8000
"""
from typing import Literal
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Patient Cost & Risk Prediction Service")

# Allow the Node backend (and, for local testing, the Vite dev server) to call this.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[""https://patient-backend-2vmt.onrender.com""],
    allow_methods=["*"],
    allow_headers=["*"],
)

cost_pipeline = joblib.load("models/cost_ridge_pipeline.joblib")
risk_pipeline = joblib.load("models/risk_tree_pipeline.joblib")

YesNo = Literal["Yes", "No"]


class PatientInput(BaseModel):
    age: int = Field(..., ge=0, le=120)
    gender: Literal["Male", "Female"]
    region: str
    bmi: float = Field(..., gt=0)
    smoker: YesNo
    alcohol_consumption: YesNo
    exercise_freq_per_week: int = Field(..., ge=0, le=14)
    systolic_bp: float
    cholesterol: float
    blood_sugar: float
    diabetes: YesNo
    hypertension: YesNo
    heart_disease: YesNo
    chronic_kidney_disease: YesNo
    cancer_history: YesNo
    num_prior_admissions: int = Field(..., ge=0)
    num_prior_surgeries: int = Field(..., ge=0)
    length_of_stay_days: int = Field(..., ge=0)
    admission_type: Literal["Routine Checkup", "Emergency", "Elective"]
    insurance_type: Literal["Uninsured", "Private", "Government"]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(patient: PatientInput):
    try:
        row = pd.DataFrame([patient.model_dump()])

        # Cost prediction (model was trained on log1p(cost))
        log_cost = cost_pipeline.predict(row)[0]
        medical_cost = float(np.expm1(log_cost))
        # Clip to the observed training range so extreme feature combos
        # don't extrapolate into unrealistic dollar figures.
        medical_cost = float(np.clip(medical_cost, 200, 26000))

        # Risk prediction + class probabilities
        risk_pred = risk_pipeline.predict(row)[0]
        proba = risk_pipeline.predict_proba(row)[0]
        classes = risk_pipeline.named_steps["tree"].classes_
        probabilities = {cls: round(float(p), 4) for cls, p in zip(classes, proba)}

        return {
            "risk_category": risk_pred,
            "risk_probabilities": probabilities,
            "medical_cost": round(medical_cost, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
