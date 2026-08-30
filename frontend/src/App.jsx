import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/predict";

const initialForm = {
  age: 55,
  gender: "Male",
  region: "North",
  bmi: 27.5,
  smoker: "No",
  alcohol_consumption: "No",
  exercise_freq_per_week: 2,
  systolic_bp: 125,
  cholesterol: 190,
  blood_sugar: 100,
  diabetes: "No",
  hypertension: "No",
  heart_disease: "No",
  chronic_kidney_disease: "No",
  cancer_history: "No",
  num_prior_admissions: 0,
  num_prior_surgeries: 0,
  length_of_stay_days: 1,
  admission_type: "Routine Checkup",
  insurance_type: "Private",
};

const YES_NO = ["No", "Yes"];
const RISK_COLOR = { Low: "#3C8562", Medium: "#C98A2C", High: "#C4453D" };

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function Section({ index, title, children }) {
  return (
    <fieldset className="section">
      <legend>
        <span className="section-index">{index}</span>
        {title}
      </legend>
      <div className="section-grid">{children}</div>
    </fieldset>
  );
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");

  const update = (key) => (e) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setResult(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  const maxCost = 26000;
  const costPct = result ? Math.min(100, (result.medical_cost / maxCost) * 100) : 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">RX</span>
          <div>
            <h1>Intake Risk Panel</h1>
            <p>Estimate admission risk tier and expected cost from patient intake data</p>
          </div>
        </div>
      </header>

      <div className="layout">
        <form className="form" onSubmit={submit}>
          <Section index="01" title="Demographics">
            <Field label="Age">
              <input type="number" min="0" max="120" value={form.age} onChange={update("age")} required />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={update("gender")}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </Field>
            <Field label="Region">
              <input type="text" value={form.region} onChange={update("region")} required />
            </Field>
            <Field label="Insurance type">
              <select value={form.insurance_type} onChange={update("insurance_type")}>
                <option>Private</option>
                <option>Government</option>
                <option>Uninsured</option>
              </select>
            </Field>
          </Section>

          <Section index="02" title="Lifestyle">
            <Field label="BMI">
              <input type="number" step="0.1" value={form.bmi} onChange={update("bmi")} required />
            </Field>
            <Field label="Smoker">
              <select value={form.smoker} onChange={update("smoker")}>
                {YES_NO.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Alcohol consumption">
              <select value={form.alcohol_consumption} onChange={update("alcohol_consumption")}>
                {YES_NO.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Exercise (days/week)">
              <input type="number" min="0" max="14" value={form.exercise_freq_per_week} onChange={update("exercise_freq_per_week")} />
            </Field>
          </Section>

          <Section index="03" title="Vitals & labs">
            <Field label="Systolic BP (mmHg)">
              <input type="number" value={form.systolic_bp} onChange={update("systolic_bp")} required />
            </Field>
            <Field label="Cholesterol (mg/dL)">
              <input type="number" value={form.cholesterol} onChange={update("cholesterol")} required />
            </Field>
            <Field label="Blood sugar (mg/dL)">
              <input type="number" value={form.blood_sugar} onChange={update("blood_sugar")} required />
            </Field>
          </Section>

          <Section index="04" title="Medical history">
            <Field label="Diabetes">
              <select value={form.diabetes} onChange={update("diabetes")}>{YES_NO.map((v) => <option key={v}>{v}</option>)}</select>
            </Field>
            <Field label="Hypertension">
              <select value={form.hypertension} onChange={update("hypertension")}>{YES_NO.map((v) => <option key={v}>{v}</option>)}</select>
            </Field>
            <Field label="Heart disease">
              <select value={form.heart_disease} onChange={update("heart_disease")}>{YES_NO.map((v) => <option key={v}>{v}</option>)}</select>
            </Field>
            <Field label="Chronic kidney disease">
              <select value={form.chronic_kidney_disease} onChange={update("chronic_kidney_disease")}>{YES_NO.map((v) => <option key={v}>{v}</option>)}</select>
            </Field>
            <Field label="Cancer history">
              <select value={form.cancer_history} onChange={update("cancer_history")}>{YES_NO.map((v) => <option key={v}>{v}</option>)}</select>
            </Field>
          </Section>

          <Section index="05" title="Admission details">
            <Field label="Admission type">
              <select value={form.admission_type} onChange={update("admission_type")}>
                <option>Routine Checkup</option>
                <option>Emergency</option>
                <option>Elective</option>
              </select>
            </Field>
            <Field label="Prior admissions">
              <input type="number" min="0" value={form.num_prior_admissions} onChange={update("num_prior_admissions")} />
            </Field>
            <Field label="Prior surgeries">
              <input type="number" min="0" value={form.num_prior_surgeries} onChange={update("num_prior_surgeries")} />
            </Field>
            <Field label="Length of stay (days)">
              <input type="number" min="0" value={form.length_of_stay_days} onChange={update("length_of_stay_days")} />
            </Field>
          </Section>

          <button className="submit-btn" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Scoring patient…" : "Run risk assessment"}
          </button>
          {status === "error" && <p className="error-msg">{errorMsg}</p>}
        </form>

        <aside className="results">
          <div className="results-inner">
            <h2>Assessment</h2>
            {!result && <p className="results-empty">Fill in the intake form and run the assessment to see the predicted risk tier and estimated cost here.</p>}

            {result && (
              <>
                <div className="risk-badge" style={{ "--risk-color": RISK_COLOR[result.risk_category] }}>
                  <span className="risk-dot" />
                  <div>
                    <span className="risk-label">Risk tier</span>
                    <span className="risk-value">{result.risk_category}</span>
                  </div>
                </div>

                <div className="prob-bars">
                  {Object.entries(result.risk_probabilities)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tier, p]) => (
                      <div className="prob-row" key={tier}>
                        <span className="prob-tier">{tier}</span>
                        <div className="prob-track">
                          <div className="prob-fill" style={{ width: `${p * 100}%`, background: RISK_COLOR[tier] }} />
                        </div>
                        <span className="prob-pct">{Math.round(p * 100)}%</span>
                      </div>
                    ))}
                </div>

                <div className="cost-card">
                  <span className="field-label">Estimated medical cost</span>
                  <span className="cost-value">${result.medical_cost.toLocaleString()}</span>
                  <div className="cost-track">
                    <div className="cost-fill" style={{ width: `${costPct}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
