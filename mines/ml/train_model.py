import os

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestRegressor


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


# --------------------------------
# LOAD DATA
# --------------------------------

df = pd.read_csv(dataset_path)


# --------------------------------
# FEATURES
# --------------------------------

features = [
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


X = df[features]

y = df["current_risk_score"]


# --------------------------------
# TRAIN MODEL
# --------------------------------

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(
    X,
    y
)


# --------------------------------
# SAVE MODEL
# --------------------------------

joblib.dump(
    model,
    model_path
)

print(
    f"Model saved successfully: {model_path}"
)