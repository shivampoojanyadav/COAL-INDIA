from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from mines.models import (
    Compliance,
    Contractor,
    ContractorDocument,
    Inspection,
    Mine,
    Violation,
)
from mines.risk_engine import update_mine_risk


class Command(BaseCommand):
    help = "Seed CoaliZEN demo mines, compliance, inspections, violations, contractors"

    def handle(self, *args, **kwargs):
        manager = User.objects.filter(role="MANAGER").first()
        inspector = User.objects.filter(role="INSPECTOR").first()
        today = timezone.localdate()

        mines_data = [
            {
                "name": "Jharia Coal Mine", "mine_code": "MINE-001",
                "subsidiary": "BCCL", "location": "Jharia, Dhanbad",
                "state": "Jharkhand", "district": "Dhanbad",
                "latitude": 23.7957, "longitude": 86.4304,
                "status": "ACTIVE", "production_capacity": 2500000,
            },
            {
                "name": "Korba Open Cast", "mine_code": "MINE-002",
                "subsidiary": "SECL", "location": "Korba",
                "state": "Chhattisgarh", "district": "Korba",
                "latitude": 22.3595, "longitude": 82.7501,
                "status": "ACTIVE", "production_capacity": 5000000,
            },
            {
                "name": "Talcher UG Mine", "mine_code": "MINE-003",
                "subsidiary": "MCL", "location": "Talcher, Angul",
                "state": "Odisha", "district": "Angul",
                "latitude": 20.9508, "longitude": 85.2284,
                "status": "MAINTENANCE", "production_capacity": 1200000,
            },
            {
                "name": "Raniganj Deep Pit", "mine_code": "MINE-004",
                "subsidiary": "ECL", "location": "Raniganj",
                "state": "West Bengal", "district": "Paschim Bardhaman",
                "latitude": 23.6243, "longitude": 87.1070,
                "status": "INACTIVE", "production_capacity": 800000,
            },
        ]

        for md in mines_data:
            mine, _ = Mine.objects.get_or_create(
                mine_code=md["mine_code"], defaults={**md, "manager": manager}
            )
            self.stdout.write(f"Mine: {mine}")

            # Compliance: 1 overdue, 1 due soon, 1 completed
            Compliance.objects.get_or_create(
                mine=mine, requirement="Annual safety audit",
                defaults={
                    "category": "SAFETY", "due_date": today - timedelta(days=12),
                    "status": "PENDING", "responsible_person": manager,
                },
            )
            Compliance.objects.get_or_create(
                mine=mine, requirement="Environment clearance renewal",
                defaults={
                    "category": "ENVIRONMENT", "due_date": today + timedelta(days=4),
                    "status": "PENDING", "responsible_person": manager,
                },
            )
            Compliance.objects.get_or_create(
                mine=mine, requirement="Quarterly production report",
                defaults={
                    "category": "PRODUCTION", "due_date": today - timedelta(days=30),
                    "status": "COMPLETED", "completed_date": today - timedelta(days=28),
                    "responsible_person": manager,
                },
            )

            # Inspection
            insp, _ = Inspection.objects.get_or_create(
                mine=mine, inspection_date=today - timedelta(days=6),
                defaults={
                    "inspector": inspector, "inspection_type": "SAFETY",
                    "status": "COMPLETED", "findings": "Ventilation OK, PPE gaps noted.",
                },
            )
            Inspection.objects.get_or_create(
                mine=mine, inspection_date=today - timedelta(days=2),
                defaults={
                    "inspector": inspector, "inspection_type": "ROUTINE",
                    "status": "SCHEDULED",
                },
            )

            # Violations (one critical open, one medium resolved)
            Violation.objects.get_or_create(
                mine=mine, inspection=insp, title="Blocked emergency exit",
                defaults={
                    "description": "Emergency exit blocked by equipment.",
                    "severity": "CRITICAL", "status": "OPEN",
                    "corrective_action": "Clear exit within 48 hours.",
                    "due_date": today - timedelta(days=3),
                },
            )
            Violation.objects.get_or_create(
                mine=mine, inspection=insp, title="Missing dust masks",
                defaults={
                    "description": "Workers without dust masks in section B.",
                    "severity": "MEDIUM", "status": "RESOLVED",
                    "corrective_action": "Issue masks and retrain.",
                    "due_date": today - timedelta(days=10),
                    "resolved_date": today - timedelta(days=8),
                },
            )

            # Contractor + documents (1 expired, 1 valid)
            contractor, _ = Contractor.objects.get_or_create(
                contractor_code=f"CONT-{mine.mine_code}",
                defaults={
                    "name": f"{mine.name} Crew", "company_name": f"{mine.subsidiary} Contractors",
                    "contact_person": "Site Incharge", "phone": "9876543210",
                    "mine": mine, "work_description": "Overburden removal",
                    "start_date": today - timedelta(days=200), "status": "ACTIVE",
                },
            )
            ContractorDocument.objects.get_or_create(
                contractor=contractor, document_type="SAFETY_CERTIFICATE",
                document_number=f"SC-{mine.mine_code}",
                defaults={
                    "issue_date": today - timedelta(days=400),
                    "expiry_date": today - timedelta(days=5),
                },
            )
            ContractorDocument.objects.get_or_create(
                contractor=contractor, document_type="INSURANCE",
                document_number=f"IN-{mine.mine_code}",
                defaults={
                    "issue_date": today - timedelta(days=30),
                    "expiry_date": today + timedelta(days=300),
                },
            )

            update_mine_risk(mine)

        self.stdout.write(self.style.SUCCESS("Demo seed data ready."))
