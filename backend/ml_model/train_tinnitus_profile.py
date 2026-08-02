import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

ML_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ML_DIR, "data")
DATASET_PATH = os.path.join(DATA_DIR, "tinnitus_profile_dataset.csv")

MODEL_VERSION = "linear_v1"
FEATURES = ["stress_level", "sleep_hours", "loudness_level", "hearing_level"]
TARGETS = ["frequency_hz", "intensity_db"]

HEARING_LEVELS = {"No": 0, "Mild": 1, "Yes": 2}

CLINICAL_SAMPLES = [
    {"stress_level": 2, "sleep_hours": 8.0, "loudness_level": 3, "hearing_loss": "No", "frequency_hz": 2500.0, "intensity_db": 6.0},
    {"stress_level": 5, "sleep_hours": 6.0, "loudness_level": 6, "hearing_loss": "Mild", "frequency_hz": 4200.0, "intensity_db": 10.0},
    {"stress_level": 8, "sleep_hours": 4.0, "loudness_level": 9, "hearing_loss": "Yes", "frequency_hz": 6200.0, "intensity_db": 18.0},
]


def generate_dataset(n_samples: int = 80, seed: int = 42, path: str = DATASET_PATH) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = [dict(row) for row in CLINICAL_SAMPLES]

    for _ in range(n_samples):
        stress = int(rng.integers(1, 11))
        loudness = int(rng.integers(1, 11))
        sleep = round(float(rng.uniform(2, 9)), 1)
        hearing = rng.choice(list(HEARING_LEVELS.keys()))
        hearing_level = HEARING_LEVELS[hearing]

        frequency = 1700 + 280 * stress + 190 * loudness + 550 * hearing_level - 120 * sleep
        frequency += float(rng.normal(0, 120))
        intensity = 2.0 + 0.7 * stress + 0.6 * loudness + 2.0 * hearing_level - 0.3 * sleep
        intensity += float(rng.normal(0, 0.6))

        rows.append({
            "stress_level": stress,
            "sleep_hours": sleep,
            "loudness_level": loudness,
            "hearing_loss": hearing,
            "frequency_hz": round(max(500.0, frequency)),
            "intensity_db": round(min(25.0, max(1.0, intensity)), 1),
        })

    df = pd.DataFrame(rows)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    return df


def load_dataset(path: str = DATASET_PATH) -> pd.DataFrame:
    if not os.path.exists(path):
        return generate_dataset(path=path)
    return pd.read_csv(path)


def train(persist: bool = True, csv_path: str = None):
    df = load_dataset(csv_path) if csv_path else load_dataset()
    df = df.copy()
    df["hearing_level"] = df["hearing_loss"].map(HEARING_LEVELS)

    X = df[FEATURES].astype(float).values
    y_freq = df["frequency_hz"].astype(float).values
    y_int = df["intensity_db"].astype(float).values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    freq_model = LinearRegression().fit(X_scaled, y_freq)
    int_model = LinearRegression().fit(X_scaled, y_int)

    freq_r2 = float(freq_model.score(X_scaled, y_freq))
    int_r2 = float(int_model.score(X_scaled, y_int))

    if persist:
        joblib.dump(freq_model, os.path.join(ML_DIR, "tinnitus_profile_freq_model.pkl"))
        joblib.dump(int_model, os.path.join(ML_DIR, "tinnitus_profile_intensity_model.pkl"))
        joblib.dump(scaler, os.path.join(ML_DIR, "tinnitus_profile_scaler.pkl"))
        metadata = {
            "model_version": MODEL_VERSION,
            "features": FEATURES,
            "targets": TARGETS,
            "hearing_levels": HEARING_LEVELS,
            "n_samples": int(len(df)),
            "freq_r2": freq_r2,
            "intensity_r2": int_r2,
            "freq_coefficients": {f: float(c) for f, c in zip(FEATURES, freq_model.coef_)},
            "intensity_coefficients": {f: float(c) for f, c in zip(FEATURES, int_model.coef_)},
        }
        with open(os.path.join(ML_DIR, "tinnitus_profile_metadata.json"), "w") as fh:
            json.dump(metadata, fh, indent=2)

    print(f"Trained tinnitus profile linear regression on {len(df)} samples.")
    print(f"  Frequency model R² = {freq_r2:.4f}")
    print(f"  Intensity model R² = {int_r2:.4f}")
    return freq_model, int_model, scaler


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the tinnitus profile linear regression models (frequency Hz, intensity dB).")
    parser.add_argument("--csv", help="Path to a CSV containing clinically measured samples.")
    parser.add_argument("--generate", type=int, nargs="?", const=80, default=0, help="Regenerate the synthetic dataset (optionally pass a sample count).")
    args = parser.parse_args()

    if args.generate:
        df = generate_dataset(n_samples=args.generate)
        print(f"Regenerated dataset with {len(df)} rows -> {DATASET_PATH}")

    train(csv_path=args.csv)


if __name__ == "__main__":
    main()
