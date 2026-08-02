import json
import os
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

from app.models.assessment import RiskLevel
from app.schemas.prediction import PredictionInput

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FEATURE_COLUMNS = [
    "severity",
    "duration_minutes",
    "stress_level",
    "sleep_quality",
    "loudness_level",
    "frequency_hz",
    "recent_triggers_count",
]


class TinnitusRiskPredictor:
    def __init__(self):
        self.model: Optional[RandomForestRegressor] = None
        self.scaler: Optional[StandardScaler] = None
        self.model_path = os.path.join(_PROJECT_ROOT, "ml_model", "risk_model.pkl")
        self.scaler_path = os.path.join(_PROJECT_ROOT, "ml_model", "scaler.pkl")
        self.model_version = "rf_v1"
        self._load_or_init()

    def _load_or_init(self):
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
        else:
            self.model = RandomForestRegressor(n_estimators=150, random_state=42)
            self.scaler = StandardScaler()
            self._train_default_model()

    def _generate_synthetic_dataset(self, n_samples: int = 2000):
        np.random.seed(42)
        data = {
            "severity": np.random.randint(1, 5, n_samples),
            "duration_minutes": np.random.randint(5, 481, n_samples),
            "stress_level": np.random.randint(1, 11, n_samples),
            "sleep_quality": np.random.randint(1, 11, n_samples),
            "loudness_level": np.random.randint(1, 11, n_samples),
            "frequency_hz": np.random.uniform(250, 8000, n_samples),
            "recent_triggers_count": np.random.randint(0, 21, n_samples),
        }
        df = pd.DataFrame(data)
        y = (
            1.0
            + 3.0 * ((df["severity"] - 1) / 3)
            + 1.3 * ((df["loudness_level"] - 1) / 9)
            + 1.0 * ((df["stress_level"] - 1) / 9)
            + 0.8 * (df["duration_minutes"] / 720)
            + 0.5 * ((10 - df["sleep_quality"]) / 9)
            + 0.4 * (df["frequency_hz"] / 8000)
            + 0.3 * (df["recent_triggers_count"] / 20)
            + np.random.normal(0, 0.4, n_samples)
        )
        y = np.clip(y, 1, 10)
        return df, y

    def _train_default_model(self):
        df, y = self._generate_synthetic_dataset(3000)
        self.train(df.to_dict(orient="records"), y.tolist(), persist=True)

    def _prepare_features(self, data: pd.DataFrame) -> np.ndarray:
        if not set(FEATURE_COLUMNS).issubset(data.columns):
            raise ValueError(f"Missing required feature columns: {FEATURE_COLUMNS}")
        return data[FEATURE_COLUMNS].astype(float).values

    def _save_model(self):
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)

    def train(self, symptom_records: list[dict], severity_scores: list[float], persist: bool = True):
        df = pd.DataFrame(symptom_records)
        X = self._prepare_features(df)
        y = np.array(severity_scores, dtype=float)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        self.model.fit(X_train_scaled, y_train)
        self._save_model()

        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        print(f"Model trained: train R²={train_score:.4f}, test R²={test_score:.4f}")

    def train_from_csv(self, csv_path: str, target_column: str = "risk_score"):
        df = pd.read_csv(csv_path)
        if target_column not in df.columns:
            raise ValueError(f"CSV must include target column '{target_column}'")
        y = df[target_column].astype(float).values
        self.train(df.to_dict(orient="records"), y.tolist(), persist=True)

    def predict(self, input_data: PredictionInput) -> dict:
        if self.model is None or self.scaler is None:
            self._load_or_init()

        features = np.array([[
            input_data.severity,
            input_data.duration_minutes,
            input_data.stress_level,
            input_data.sleep_quality,
            input_data.loudness_level,
            input_data.frequency_hz,
            input_data.recent_triggers_count,
        ]], dtype=float)

        features_scaled = self.scaler.transform(features)
        severity_score = float(self.model.predict(features_scaled)[0])
        severity_score = max(1.0, min(10.0, severity_score))

        flare_up_prob = min(0.95, max(0.05, (severity_score - 1) / 9 * 0.8 + 0.1))

        if severity_score <= 3.5:
            risk_level = RiskLevel.LOW
            recommendation = "Your tinnitus symptoms appear well-managed. Continue your current routine and monitor for any changes."
        elif severity_score <= 6.5:
            risk_level = RiskLevel.MEDIUM
            recommendation = "Moderate risk detected. Consider reviewing your trigger management strategies and consult your healthcare provider if symptoms persist."
        else:
            risk_level = RiskLevel.HIGH
            recommendation = "High risk of flare-up detected. Please contact your healthcare provider and follow your prescribed care plan."

        return {
            "predicted_risk": risk_level.value,
            "predicted_severity_score": round(severity_score, 2),
            "flare_up_probability": round(flare_up_prob, 2),
            "recommendation": recommendation,
            "model_version": self.model_version,
        }


risk_predictor = TinnitusRiskPredictor()
