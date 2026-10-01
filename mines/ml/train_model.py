import os

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

dataset_path = os.path.join(
    BASE_DIR,
    "ml_data",
    "mine_risk_dataset.csv"
)

model_directory = os.path.join(
    BASE_DIR,
    "ml_models"
)

os.makedirs(
    model_directory,
    exist_ok=True
)

model_path = os.path.join(
    model_directory,
    "mine_risk_model.pkl"
)

FEATURES = [
    "total_violations",
    "critical_violations",
    "high_violations",
    "open_violations",
    "overdue_compliance",
    "total_compliance",
    "total_inspections",
    "completed_inspections",
    "overdue_inspections",
    "expired_documents",
]


def train():
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(
            f"Dataset not found at {dataset_path}. "
            "Run: python manage.py generate_ml_dataset first."
        )

    df = pd.read_csv(dataset_path)

    missing = [c for c in FEATURES + ["current_risk_score"] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing columns: {missing}")

    X = df[FEATURES]
    y = df["current_risk_score"]

    if len(df) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
    else:
        X_train, y_train = X, y
        X_test, y_test = X, y

    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42
    )

    model.fit(X_train, y_train)

    try:
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        print(f"Validation MAE: {mae:.2f} (n={len(X_test)})")
    except Exception as exc:
        print(f"Could not compute metrics: {exc}")

    joblib.dump(model, model_path)

    # Clear cached model so running server picks up the new file.
    try:
        from mines.ml import predict as _predict

        _predict._model_cache = None
    except Exception:
        pass

    print(f"Model saved successfully: {model_path}")
    return model_path


if __name__ == "__main__":
    train()
