import os
from typing import Optional, Tuple

import joblib
import numpy as np

from app.schemas.tinnitus_profile import TinnitusProfileInput
from app.services.langchain_service import langchain_service

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ML_DIR = os.path.join(_PROJECT_ROOT, "ml_model")

FEATURES = ["stress_level", "sleep_hours", "loudness_level", "hearing_level"]
HEARING_LEVELS = {"No": 0, "Mild": 1, "Yes": 2}
MODEL_VERSION = "linear_v1"


class TinnitusProfilePredictor:
    def __init__(self):
        self.freq_model: Optional[object] = None
        self.intensity_model: Optional[object] = None
        self.scaler: Optional[object] = None
        self._load_or_init()

    def _model_paths(self):
        return {
            "freq": os.path.join(ML_DIR, "tinnitus_profile_freq_model.pkl"),
            "intensity": os.path.join(ML_DIR, "tinnitus_profile_intensity_model.pkl"),
            "scaler": os.path.join(ML_DIR, "tinnitus_profile_scaler.pkl"),
        }

    def _load_or_init(self):
        paths = self._model_paths()
        if all(os.path.exists(p) for p in paths.values()):
            self.freq_model = joblib.load(paths["freq"])
            self.intensity_model = joblib.load(paths["intensity"])
            self.scaler = joblib.load(paths["scaler"])
            return

        from ml_model.train_tinnitus_profile import train

        train(persist=True)
        self._load_or_init()

    def _features(self, data: TinnitusProfileInput) -> np.ndarray:
        hearing_level = HEARING_LEVELS.get(data.hearing_loss)
        if hearing_level is None:
            raise ValueError(
                f"hearing_loss must be one of {list(HEARING_LEVELS.keys())}, got '{data.hearing_loss}'"
            )
        return np.array(
            [[data.stress_level, data.sleep_hours, data.loudness_level, hearing_level]],
            dtype=float,
        )

    @staticmethod
    def _derive_risk(intensity_db: float) -> Tuple[str, float]:
        if intensity_db < 8:
            return "low", 3.0
        if intensity_db <= 14:
            return "medium", 6.0
        return "high", 9.0

    def predict(self, data: TinnitusProfileInput) -> dict:
        X_scaled = self.scaler.transform(self._features(data))
        frequency_hz = float(self.freq_model.predict(X_scaled)[0])
        intensity_db = float(self.intensity_model.predict(X_scaled)[0])

        frequency_hz = max(250.0, round(frequency_hz))
        intensity_db = max(1.0, round(intensity_db, 1))
        risk_level, risk_score = self._derive_risk(intensity_db)

        return {
            "estimated_frequency_hz": frequency_hz,
            "estimated_intensity_db": intensity_db,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "model_version": MODEL_VERSION,
        }

    def recommend(self, data: TinnitusProfileInput) -> dict:
        result = self.predict(data)
        ai = langchain_service.generate_sound_therapy_recommendation(
            {
                "stress_level": data.stress_level,
                "sleep_hours": data.sleep_hours,
                "loudness_level": data.loudness_level,
                "hearing_loss": data.hearing_loss,
                **result,
            }
        )
        result.update(ai)
        return result


tinnitus_profile_predictor = TinnitusProfilePredictor()
