import argparse
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.prediction_service import TinnitusRiskPredictor


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the tinnitus risk prediction model.")
    parser.add_argument("--csv", help="Path to a CSV file containing training data.")
    parser.add_argument("--target-column", default="risk_score", help="Target column name in the CSV for risk score.")
    parser.add_argument("--no-default", action="store_true", help="Do not generate a default synthetic model when no model exists.")
    args = parser.parse_args()

    predictor = TinnitusRiskPredictor()

    if args.csv:
        print(f"Training model from CSV: {args.csv}")
        predictor.train_from_csv(args.csv, target_column=args.target_column)
    elif args.no_default:
        print("No training source provided and default model generation is disabled.")
    else:
        print("Training default synthetic tinnitus risk model...")
        predictor._train_default_model()

    print("Model training complete.")


if __name__ == "__main__":
    main()
