
from django.conf import settings
from django.db import models
from datetime import date, timedelta

class Mine(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        MAINTENANCE = "MAINTENANCE", "Under Maintenance"

    name = models.CharField(max_length=150)

    mine_code = models.CharField(
        max_length=50,
        unique=True
    )

    subsidiary = models.CharField(
        max_length=150
    )

    location = models.CharField(
        max_length=200
    )

    state = models.CharField(
        max_length=100
    )

    district = models.CharField(
        max_length=100
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_mines",
        limit_choices_to={"role": "MANAGER"}
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    production_capacity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Annual production capacity in tonnes"
    )

    risk_score = models.DecimalField(
    max_digits=5,
    decimal_places=2,
    default=0
)

    risk_level = models.CharField(
        max_length=20,
        default="LOW"
    )

    risk_updated_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.name} ({self.mine_code})"



class Compliance(models.Model):

    class Category(models.TextChoices):
        SAFETY = "SAFETY", "Safety"
        ENVIRONMENT = "ENVIRONMENT", "Environment"
        PRODUCTION = "PRODUCTION", "Production"
        LABOUR = "LABOUR", "Labour"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"

    mine = models.ForeignKey(
        Mine,
        on_delete=models.CASCADE,
        related_name="compliances"
    )

    requirement = models.CharField(
        max_length=250
    )

    category = models.CharField(
        max_length=30,
        choices=Category.choices
    )

    description = models.TextField(
        blank=True
    )

    due_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    responsible_person = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_compliances"
    )

    completed_date = models.DateField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    @property
    def monitoring_status(self):

        if self.status == self.Status.COMPLETED:
            return "COMPLETED"

        today = date.today()

        if self.due_date < today:
            return "OVERDUE"

        if self.due_date <= today + timedelta(days=7):
            return "DUE_SOON"

        return "UPCOMING"

    def __str__(self):
        return f"{self.mine.name} - {self.requirement}"


class Inspection(models.Model):

    class InspectionType(models.TextChoices):
        ROUTINE = "ROUTINE", "Routine Inspection"
        SAFETY = "SAFETY", "Safety Inspection"
        ENVIRONMENT = "ENVIRONMENT", "Environmental Inspection"
        SURPRISE = "SURPRISE", "Surprise Inspection"
        COMPLIANCE = "COMPLIANCE", "Compliance Inspection"

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    mine = models.ForeignKey(
        Mine,
        on_delete=models.CASCADE,
        related_name="inspections"
    )

    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inspections_conducted",
        limit_choices_to={"role": "INSPECTOR"}
    )

    inspection_type = models.CharField(
        max_length=30,
        choices=InspectionType.choices,
        default=InspectionType.ROUTINE
    )

    inspection_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED
    )

    findings = models.TextField(
        blank=True,
        help_text="Inspection findings and observations"
    )

    remarks = models.TextField(
        blank=True,
        help_text="Additional remarks"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.mine.name} - {self.inspection_date}"


class Violation(models.Model):

    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"

    inspection = models.ForeignKey(
        Inspection,
        on_delete=models.CASCADE,
        related_name="violations"
    )

    mine = models.ForeignKey(
        Mine,
        on_delete=models.CASCADE,
        related_name="violations"
    )

    title = models.CharField(max_length=200)

    description = models.TextField()

    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.MEDIUM
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )

    corrective_action = models.TextField(
        blank=True,
        help_text="Action required to resolve the violation"
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_violations"
    )

    due_date = models.DateField(
        null=True,
        blank=True
    )

    resolved_date = models.DateField(
        null=True,
        blank=True
    )

    remarks = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.mine.name} - {self.title}"

class Contractor(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        SUSPENDED = "SUSPENDED", "Suspended"

    name = models.CharField(max_length=200)

    contractor_code = models.CharField(
        max_length=50,
        unique=True
    )

    company_name = models.CharField(
        max_length=200
    )

    contact_person = models.CharField(
        max_length=150
    )

    phone = models.CharField(
        max_length=20
    )

    email = models.EmailField(
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    mine = models.ForeignKey(
        Mine,
        on_delete=models.CASCADE,
        related_name="contractors"
    )

    work_description = models.TextField(
        blank=True,
        help_text="Description of work performed by the contractor"
    )

    start_date = models.DateField()

    end_date = models.DateField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.company_name} ({self.contractor_code})"


class ContractorDocument(models.Model):

    class DocumentType(models.TextChoices):
        LICENSE = "LICENSE", "License"
        SAFETY_CERTIFICATE = "SAFETY_CERTIFICATE", "Safety Certificate"
        INSURANCE = "INSURANCE", "Insurance"
        LABOUR_LICENSE = "LABOUR_LICENSE", "Labour License"
        ENVIRONMENTAL = "ENVIRONMENTAL", "Environmental Certificate"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        VALID = "VALID", "Valid"
        EXPIRING = "EXPIRING", "Expiring Soon"
        EXPIRED = "EXPIRED", "Expired"

    contractor = models.ForeignKey(
        Contractor,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    document_type = models.CharField(
        max_length=40,
        choices=DocumentType.choices
    )

    document_number = models.CharField(
        max_length=100
    )

    issue_date = models.DateField()

    expiry_date = models.DateField()

    issuing_authority = models.CharField(
        max_length=200,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.VALID
    )

    remarks = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    @property
    def calculated_status(self):

        today = date.today()

        if self.expiry_date < today:
            return "EXPIRED"

        if self.expiry_date <= today + timedelta(days=30):
            return "EXPIRING"

        return "VALID"

    def __str__(self):
        return f"{self.contractor.company_name} - {self.document_type}"

class Notification(models.Model):

    class NotificationType(models.TextChoices):
        COMPLIANCE = "COMPLIANCE", "Compliance"
        VIOLATION = "VIOLATION", "Violation"
        CONTRACTOR = "CONTRACTOR", "Contractor"
        INSPECTION = "INSPECTION", "Inspection"
        SYSTEM = "SYSTEM", "System"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices
    )

    title = models.CharField(
        max_length=200
    )

    message = models.TextField()

    link = models.CharField(
        max_length=300,
        blank=True
    )

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"

    class Meta:
        ordering = ["-created_at"]


class RiskHistory(models.Model):

    mine = models.ForeignKey(
        Mine,
        on_delete=models.CASCADE,
        related_name="risk_history"
    )

    risk_score = models.DecimalField(
        max_digits=5,
        decimal_places=2
    )

    risk_level = models.CharField(
        max_length=20
    )

    risk_factors = models.TextField(
        blank=True
    )

    recorded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.mine.name} - "
            f"{self.risk_score} - "
            f"{self.risk_level}"
        )

    class Meta:
        ordering = ["-recorded_at"]