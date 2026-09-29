from django.utils import timezone

from mines.models import (
    ContractorDocument,
    Mine,
)


def build_mine_dataset():

    dataset = []

    mines = Mine.objects.all()

    for mine in mines:

        # -----------------------------
        # VIOLATIONS
        # -----------------------------

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

        # -----------------------------
        # COMPLIANCE
        # -----------------------------

        overdue_compliance = mine.compliances.filter(
            status="PENDING",
            due_date__lt=timezone.localdate()
        ).count()

        total_compliance = mine.compliances.count()

        # -----------------------------
        # INSPECTIONS
        # -----------------------------

        total_inspections = mine.inspections.count()

        completed_inspections = mine.inspections.filter(
            status="COMPLETED"
        ).count()

        overdue_inspections = mine.inspections.filter(
            status="SCHEDULED",
            inspection_date__lt=__import__(
                "django.utils.timezone",
                fromlist=["localdate"]
            ).localdate()
        ).count()

        # -----------------------------
        # CONTRACTOR DOCUMENTS
        # -----------------------------

        expired_documents = ContractorDocument.objects.filter(
            contractor__mine=mine,
            expiry_date__lt=__import__(
                "django.utils.timezone",
                fromlist=["localdate"]
            ).localdate()
        ).count()

        # -----------------------------
        # CURRENT RISK
        # -----------------------------

        current_risk_score = float(
            mine.risk_score or 0
        )

        # -----------------------------
        # CREATE FEATURE ROW
        # -----------------------------

        row = {
            "mine_id": mine.id,

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

            "current_risk_score": current_risk_score,
        }

        dataset.append(row)

    return dataset