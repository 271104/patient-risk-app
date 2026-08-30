# Patient Cost & Risk Intake Panel

Three-tier app: **React (Vite) frontend → Node/Express backend → Python FastAPI ML service.**

```
patient-risk-app/
├── ml_service/       Python FastAPI — serves the trained models
│   ├── train_model.py       trains Ridge (cost) + Decision Tree (risk), saves them
│   ├── app.py                FastAPI app exposing POST /predict
│   ├── models/                saved .joblib pipelines (already trained)
│   └── requirements.txt
├── backend/          Node/Express — proxies the frontend to the ML service
│   ├── server.js
│   └── .env                   PORT and ML_SERVICE_URL
└── frontend/          React (Vite) — patient intake form + results panel
    └── src/App.jsx
```

## Models

- **Ridge Regression** → predicts `medical_cost` (trained on `log1p(cost)`, since cost is right-skewed; test R² ≈ 0.73, MAE ≈ $1,255)
- **Decision Tree Classifier** → predicts `risk_category` (Low/Medium/High), with `class_weight="balanced"` to handle the class imbalance (macro F1 ≈ 0.64)

Both are wrapped in an sklearn `Pipeline` (OneHotEncoder + StandardScaler → model) so raw form fields go in and a prediction comes out — no manual preprocessing needed on the frontend or backend.

## Run it locally

**1. ML service (port 8000)**
```bash
cd ml_service
pip install -r requirements.txt
# models/*.joblib are already trained and included.
# To retrain from the CSV yourself: python train_model.py
uvicorn app:app --reload --port 8000
```

**2. Backend (port 4000)**
```bash
cd backend
npm install
node server.js
```

**3. Frontend (port 5173)**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**, fill in the intake form, and click "Run risk assessment." The request flows: React → `POST /api/predict` on the Node backend → `POST /predict` on the FastAPI service → prediction flows back up.

## Notes

- The cost prediction is clipped to $200–$26,000 (the observed training range) to avoid unrealistic extrapolation on extreme input combinations.
- CORS is open (`*`) on the FastAPI service for local development — restrict `allow_origins` before deploying anywhere public.
- To point the frontend at a deployed backend, set `VITE_API_URL` in a `frontend/.env` file.
- To point the backend at a deployed ML service, set `ML_SERVICE_URL` in `backend/.env`.
