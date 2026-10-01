import os

import joblib
import pandas as pd

from django.conf import settings
from django.utils import timezone

from mines.models import ContractorDocument, Mine


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


_model_cache = None


def get_model():

    global _model_cache

    if _model_cache is not None:
        return _model_cache

    model_path = os.path.join(
        settings.BASE_DIR,
        "ml_models",
        "mine_risk_model.pkl"
    )

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"ML model not found at {model_path}. "
            "Run: python manage.py generate_ml_dataset and train the model."
        )

    _model_cache = joblib.load(model_path)

    return _model_cache


def get_mine_features(mine):

    today = timezone.localdate()

    violations = mine.violations.all()

    total_violations = violations.count()

    critical_violations = violations.filter(
        severity="CRITICAL"
    ).count()

    high_violations = violations.filter(
        severity="HIGH"
    ).count()

    open_violations = violations.filter(
        status__in=["OPEN", "IN_PROGRESS"]
    ).count()

    overdue_compliance = mine.compliances.filter(
        status="PENDING",
        due_date__lt=today
    ).count()

    total_compliance = mine.compliances.count()

    total_inspections = mine.inspections.count()

    completed_inspections = mine.inspections.filter(
        status="COMPLETED"
    ).count()

    overdue_inspections = mine.inspections.filter(
        status="SCHEDULED",
        inspection_date__lt=today
    ).count()

    expired_documents = ContractorDocument.objects.filter(
        contractor__mine=mine,
        expiry_date__lt=today
    ).count()

    return {
        "total_violations": total_violations,
        "critical_violations": critical_violations,
        "high_violations": high_violations,
        "open_violations": open_violations,
        "overdue_compliance": overdue_compliance,
        "total_compliance": total_compliance,
        "total_inspections": total_inspections,
        "completed_inspections": completed_inspections,
        "overdue_inspections": overdue_inspections,
        "expired_documents": expired_documents,
    }


def predict_mine_risk(mine):

    model = get_model()

    features = get_mine_features(mine)

    dataframe = pd.DataFrame(
        [features],
        columns=FEATURES
    )

    predicted_score = model.predict(dataframe)[0]

    predicted_score = max(
        0,
        min(100, float(predicted_score))
    )

    if predicted_score >= 75:
        risk_level = "CRITICAL"

    elif predicted_score >= 50:
        risk_level = "HIGH"

    elif predicted_score >= 25:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    return {
        "score": round(predicted_score, 2),
        "level": risk_level,
        "features": features,
    }