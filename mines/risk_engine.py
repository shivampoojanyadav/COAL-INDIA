from django.utils import timezone

from .models import (
    ContractorDocument,
    RiskHistory,
)


def calculate_mine_risk(mine):

    score = 0
    factors = []

    today = timezone.localdate()

    # --------------------------------
    # VIOLATION RISK
    # --------------------------------

    open_violations = mine.violations.filter(
        status__in=["OPEN", "IN_PROGRESS"]
    )

    for violation in open_violations:

        if violation.severity == "LOW":
            score += 5

        elif violation.severity == "MEDIUM":
            score += 10

        elif violation.severity == "HIGH":
            score += 20

        elif violation.severity == "CRITICAL":
            score += 35

        factors.append(
            f"{violation.get_severity_display()} severity violation"
        )

    # --------------------------------
    # COMPLIANCE RISK
    # --------------------------------

    overdue_compliance = mine.compliances.filter(
        status="PENDING",
        due_date__lt=today
    )

    overdue_count = overdue_compliance.count()

    if overdue_count:

        score += min(overdue_count * 10, 30)

        factors.append(
            f"{overdue_count} overdue compliance item(s)"
        )

    # --------------------------------
    # INSPECTION RISK
    # --------------------------------

    pending_inspections = mine.inspections.filter(
        status="SCHEDULED",
        inspection_date__lt=today
    )

    pending_count = pending_inspections.count()

    if pending_count:

        score += min(pending_count * 10, 20)

        factors.append(
            f"{pending_count} overdue inspection(s)"
        )

    # --------------------------------
    # CONTRACTOR DOCUMENT RISK
    # --------------------------------

    contractors = mine.contractors.all()

    expired_documents = ContractorDocument.objects.filter(
        contractor__in=contractors,
        expiry_date__lt=today
    )

    expired_count = expired_documents.count()

    if expired_count:

        score += min(expired_count * 5, 20)

        factors.append(
            f"{expired_count} expired contractor document(s)"
        )

    # --------------------------------
    # MAXIMUM SCORE
    # --------------------------------

    score = min(score, 100)

    # --------------------------------
    # RISK LEVEL
    # --------------------------------

    if score >= 75:
        risk_level = "CRITICAL"

    elif score >= 50:
        risk_level = "HIGH"

    elif score >= 25:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    return {
        "score": score,
        "level": risk_level,
        "factors": factors,
    }


def update_mine_risk(mine):

    result = calculate_mine_risk(mine)

    previous_score = mine.risk_score
    previous_level = mine.risk_level

    mine.risk_score = result["score"]
    mine.risk_level = result["level"]
    mine.risk_updated_at = timezone.now()

    mine.save(
        update_fields=[
            "risk_score",
            "risk_level",
            "risk_updated_at",
        ]
    )

    score_changed = (
        previous_score != result["score"]
        or previous_level != result["level"]
    )

    if score_changed:

        RiskHistory.objects.create(
            mine=mine,
            risk_score=result["score"],
            risk_level=result["level"],
            risk_factors="; ".join(result["factors"])
        )

    return result