from django.contrib import admin

from .models import (
    Compliance,
    Inspection,
    Mine,
    Violation,
    Contractor,
    ContractorDocument,
    Notification,
    RiskHistory,
)


@admin.register(Mine)
class MineAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "mine_code",
        "subsidiary",
        "state",
        "district",
        "manager",
        "status",
    )

    list_filter = (
        "status",
        "state",
        "subsidiary",
    )

    search_fields = (
        "name",
        "mine_code",
        "location",
        "district",
        "state",
    )


@admin.register(Compliance)
class ComplianceAdmin(admin.ModelAdmin):

    list_display = (
        "requirement",
        "mine",
        "category",
        "due_date",
        "status",
        "responsible_person",
    )

    list_filter = (
        "category",
        "status",
        "due_date",
    )

    search_fields = (
        "requirement",
        "mine__name",
        "mine__mine_code",
    )

@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):

    list_display = (
        "mine",
        "inspector",
        "inspection_type",
        "inspection_date",
        "status",
    )

    list_filter = (
        "inspection_type",
        "status",
        "inspection_date",
    )

    search_fields = (
        "mine__name",
        "mine__mine_code",
        "inspector__username",
    )

@admin.register(Violation)
class ViolationAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "mine",
        "severity",
        "status",
        "assigned_to",
        "due_date",
    )

    list_filter = (
        "severity",
        "status",
        "due_date",
    )

    search_fields = (
        "title",
        "mine__name",
        "mine__mine_code",
        "description",
    )

@admin.register(Contractor)
class ContractorAdmin(admin.ModelAdmin):

    list_display = (
        "company_name",
        "contractor_code",
        "mine",
        "contact_person",
        "phone",
        "status",
    )

    list_filter = (
        "status",
        "mine",
    )

    search_fields = (
        "company_name",
        "contractor_code",
        "contact_person",
        "phone",
    )

@admin.register(ContractorDocument)
class ContractorDocumentAdmin(admin.ModelAdmin):

    list_display = (
        "contractor",
        "document_type",
        "document_number",
        "issue_date",
        "expiry_date",
        "status",
    )

    list_filter = (
        "document_type",
        "status",
        "expiry_date",
    )

    search_fields = (
        "contractor__company_name",
        "document_number",
    )

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):

    list_display = (
        "recipient",
        "notification_type",
        "title",
        "is_read",
        "created_at",
    )

    list_filter = (
        "notification_type",
        "is_read",
        "created_at",
    )

    search_fields = (
        "recipient__username",
        "title",
        "message",
    )

@admin.register(RiskHistory)
class RiskHistoryAdmin(admin.ModelAdmin):

    list_display = (
        "mine",
        "risk_score",
        "risk_level",
        "recorded_at",
    )

    list_filter = (
        "risk_level",
        "recorded_at",
    )

    search_fields = (
        "mine__name",
        "mine__mine_code",
    )