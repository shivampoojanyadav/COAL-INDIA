
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from datetime import date, timedelta
from django.shortcuts import get_object_or_404, redirect, render
from .risk_engine import update_mine_risk
from .ml.predict import predict_mine_risk
from .ai_engine import generate_risk_explanation
from datetime import timedelta

from django.shortcuts import render, redirect
from django.utils import timezone

from .forms import (
    ComplianceForm,
    InspectionForm,
    MineForm,
    ViolationForm,
    ContractorForm,
    ContractorDocumentForm,
)
from .models import (
    Compliance,
    Inspection,
    Mine,
    Violation,
    Contractor,
    ContractorDocument,
    Notification,
)

from django.shortcuts import (
    get_object_or_404,
    redirect,
    render,
)


@login_required
def mine_list(request):

    if request.user.role not in ["ADMIN", "MANAGER"]:
        return redirect("unauthorized")

    mines = Mine.objects.select_related("manager").all()

    search = request.GET.get("search", "")
    status = request.GET.get("status", "")
    state = request.GET.get("state", "")

    if search:
        mines = mines.filter(
            name__icontains=search
        ) | mines.filter(
            mine_code__icontains=search
        )

    if status:
        mines = mines.filter(status=status)

    if state:
        mines = mines.filter(state__iexact=state)

    states = (
        Mine.objects
        .values_list("state", flat=True)
        .distinct()
        .order_by("state")
    )

    context = {
        "mines": mines,
        "search": search,
        "selected_status": status,
        "selected_state": state,
        "states": states,
        "status_choices": Mine.Status.choices,
    }

    return render(
        request,
        "mines/mine_list.html",
        context
    )


@login_required
def mine_create(request):

    if request.user.role not in ["ADMIN", "MANAGER"]:
        return redirect("unauthorized")

    if request.method == "POST":

        form = MineForm(request.POST)

        if form.is_valid():
            form.save()

            return redirect("mine_list")

    else:
        form = MineForm()

    return render(
        request,
        "mines/mine_form.html",
        {
            "form": form,
            "page_title": "Add Mine",
        }
    )

@login_required
def mine_edit(request, mine_id):

    if request.user.role not in ["ADMIN", "MANAGER"]:
        return redirect("unauthorized")

    mine = get_object_or_404(Mine, id=mine_id)

    if request.method == "POST":

        form = MineForm(
            request.POST,
            instance=mine
        )

        if form.is_valid():
            form.save()

            return redirect("mine_list")

    else:

        form = MineForm(
            instance=mine
        )

    return render(
        request,
        "mines/mine_form.html",
        {
            "form": form,
            "page_title": "Edit Mine",
            "mine": mine,
        }
    )


@login_required
def mine_delete(request, mine_id):

    if request.user.role not in ["ADMIN", "MANAGER"]:
        return redirect("unauthorized")

    mine = get_object_or_404(
        Mine,
        id=mine_id
    )

    if request.method == "POST":

        mine.delete()

        return redirect("mine_list")

    return render(
        request,
        "mines/mine_confirm_delete.html",
        {
            "mine": mine,
        }
    )


@login_required
def mine_detail(request, mine_id):

    if request.user.role not in [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]:
        return redirect("unauthorized")

    mine = get_object_or_404(
        Mine.objects.select_related("manager"),
        id=mine_id
    )

    return render(
        request,
        "mines/mine_detail.html",
        {
            "mine": mine,
        }
    )

@login_required
def compliance_list(request):

    if request.user.role not in [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]:
        return redirect("unauthorized")

    compliances = (
        Compliance.objects
        .select_related(
            "mine",
            "responsible_person"
        )
        .all()
        .order_by("due_date")
    )

    return render(
        request,
        "compliance/compliance_list.html",
        {
            "compliances": compliances,
        }
    )


@login_required
def compliance_create(request):

    if request.user.role not in [
        "ADMIN",
        "MANAGER",
    ]:
        return redirect("unauthorized")

    if request.method == "POST":

        form = ComplianceForm(request.POST)

        if form.is_valid():
            form.save()

            return redirect("compliance_list")

    else:
        form = ComplianceForm()

    return render(
        request,
        "compliance/compliance_form.html",
        {
            "form": form,
            "page_title": "Add Compliance",
        }
    )

@login_required
def inspection_list(request):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]

    if request.user.role not in allowed_roles:
        return redirect("unauthorized")

    inspections = Inspection.objects.select_related(
        "mine",
        "inspector"
    ).order_by("-inspection_date")

    search = request.GET.get("search", "")
    status = request.GET.get("status", "")

    if search:
        inspections = inspections.filter(
            mine__name__icontains=search
        )

    if status:
        inspections = inspections.filter(
            status=status
        )

    context = {
        "inspections": inspections,
        "search": search,
        "status": status,
        "status_choices": Inspection.Status.choices,
    }

    return render(
        request,
        "inspections/inspection_list.html",
        context
    )


@login_required
def inspection_create(request):

    if request.user.role not in ["ADMIN", "MANAGER"]:
        return redirect("unauthorized")

    if request.method == "POST":
        form = InspectionForm(request.POST)

        if form.is_valid():
            form.save()
            return redirect("inspection_list")

    else:
        form = InspectionForm()

    return render(
        request,
        "inspections/inspection_form.html",
        {
            "form": form,
            "page_title": "Add Inspection",
        }
    )

@login_required
def inspection_detail(request, inspection_id):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]

    if request.user.role not in allowed_roles:
        return redirect("unauthorized")

    inspection = get_object_or_404(
        Inspection.objects.select_related(
            "mine",
            "inspector"
        ),
        id=inspection_id
    )

    return render(
        request,
        "inspections/inspection_detail.html",
        {
            "inspection": inspection
        }
    )

@login_required
def violation_list(request):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]

    if request.user.role not in allowed_roles:
        return redirect("unauthorized")

    violations = Violation.objects.select_related(
        "mine",
        "inspection",
        "assigned_to"
    ).order_by("-created_at")

    search = request.GET.get("search", "")
    status = request.GET.get("status", "")
    severity = request.GET.get("severity", "")

    if search:
        violations = violations.filter(
            title__icontains=search
        )

    if status:
        violations = violations.filter(
            status=status
        )

    if severity:
        violations = violations.filter(
            severity=severity
        )

    context = {
        "violations": violations,
        "search": search,
        "status": status,
        "severity": severity,
        "status_choices": Violation.Status.choices,
        "severity_choices": Violation.Severity.choices,
    }

    return render(
        request,
        "violations/violation_list.html",
        context
    )

@login_required
def violation_create(request):

    if request.user.role not in ["ADMIN", "MANAGER", "INSPECTOR"]:
        return redirect("unauthorized")

    if request.method == "POST":
        form = ViolationForm(request.POST)

        if form.is_valid():
            form.save()
            return redirect("violation_list")

    else:
        form = ViolationForm()

    return render(
        request,
        "violations/violation_form.html",
        {
            "form": form,
            "page_title": "Add Violation",
        }
    )

@login_required
def violation_detail(request, violation_id):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]

    if request.user.role not in allowed_roles:
        return redirect("unauthorized")

    violation = get_object_or_404(
        Violation.objects.select_related(
            "mine",
            "inspection",
            "assigned_to"
        ),
        id=violation_id
    )

    return render(
        request,
        "violations/violation_detail.html",
        {
            "violation": violation
        }
    )


@login_required
def contractor_list(request):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]

    if request.user.role not in allowed_roles:
        return redirect("unauthorized")

    contractors = Contractor.objects.select_related(
        "mine"
    ).order_by("-created_at")

    search = request.GET.get("search", "")
    status = request.GET.get("status", "")

    if search:
        contractors = contractors.filter(
            company_name__icontains=search
        )

    if status:
        contractors = contractors.filter(
            status=status
        )

    context = {
        "contractors": contractors,
        "search": search,
        "status": status,
        "status_choices": Contractor.Status.choices,
    }

    return render(
        request,
        "contractors/contractor_list.html",
        context
    )

@login_required
def contractor_create(request):

    if request.user.role not in ["ADMIN", "MANAGER"]:
        return redirect("unauthorized")

    if request.method == "POST":
        form = ContractorForm(request.POST)

        if form.is_valid():
            form.save()
            return redirect("contractor_list")

    else:
        form = ContractorForm()

    return render(
        request,
        "contractors/contractor_form.html",
        {
            "form": form,
            "page_title": "Add Contractor",
        }
    )

@login_required
def contractor_detail(request, contractor_id):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]

    if request.user.role not in allowed_roles:
        return redirect("unauthorized")

    contractor = get_object_or_404(
        Contractor.objects.select_related("mine"),
        id=contractor_id
    )

    documents = contractor.documents.order_by(
        "expiry_date"
    )

    return render(
        request,
        "contractors/contractor_detail.html",
        {
            "contractor": contractor,
            "documents": documents,
        }
    )

@login_required
def contractor_document_create(request):

    if request.user.role not in ["ADMIN", "MANAGER"]:
        return redirect("unauthorized")

    if request.method == "POST":
        form = ContractorDocumentForm(request.POST)

        if form.is_valid():
            form.save()
            return redirect("contractor_list")

    else:
        form = ContractorDocumentForm()

    return render(
        request,
        "contractors/contractor_document_form.html",
        {
            "form": form,
            "page_title": "Add Contractor Document",
        }
    )

def generate_notifications(user):

    today = date.today()

    # --------------------------------
    # COMPLIANCE ALERTS
    # --------------------------------

    compliances = Compliance.objects.select_related(
        "mine"
    ).filter(
        status="PENDING"
    )

    for compliance in compliances:

        if compliance.due_date < today:

            title = "Compliance Overdue"

            message = (
                f"{compliance.requirement} for "
                f"{compliance.mine.name} is overdue."
            )

            Notification.objects.get_or_create(
                recipient=user,
                notification_type="COMPLIANCE",
                title=title,
                message=message,
                defaults={
                    "link": f"/compliance/"
                }
            )

        elif compliance.due_date <= today + timedelta(days=7):

            title = "Compliance Due Soon"

            message = (
                f"{compliance.requirement} for "
                f"{compliance.mine.name} is due on "
                f"{compliance.due_date}."
            )

            Notification.objects.get_or_create(
                recipient=user,
                notification_type="COMPLIANCE",
                title=title,
                message=message,
                defaults={
                    "link": "/compliance/"
                }
            )

    # --------------------------------
    # VIOLATION ALERTS
    # --------------------------------

    violations = Violation.objects.select_related(
        "mine"
    ).filter(
        status__in=["OPEN", "IN_PROGRESS"]
    )

    for violation in violations:

        if violation.due_date:

            if violation.due_date < today:

                title = "Violation Overdue"

                message = (
                    f"Violation '{violation.title}' at "
                    f"{violation.mine.name} is overdue."
                )

                Notification.objects.get_or_create(
                    recipient=user,
                    notification_type="VIOLATION",
                    title=title,
                    message=message,
                    defaults={
                        "link": "/violations/"
                    }
                )

            elif violation.due_date <= today + timedelta(days=7):

                title = "Violation Due Soon"

                message = (
                    f"Violation '{violation.title}' at "
                    f"{violation.mine.name} requires attention "
                    f"by {violation.due_date}."
                )

                Notification.objects.get_or_create(
                    recipient=user,
                    notification_type="VIOLATION",
                    title=title,
                    message=message,
                    defaults={
                        "link": "/violations/"
                    }
                )

    # --------------------------------
    # CONTRACTOR DOCUMENT ALERTS
    # --------------------------------

    documents = ContractorDocument.objects.select_related(
        "contractor"
    )

    for document in documents:

        if document.expiry_date < today:

            title = "Contractor Document Expired"

            message = (
                f"{document.get_document_type_display()} for "
                f"{document.contractor.company_name} has expired."
            )

            Notification.objects.get_or_create(
                recipient=user,
                notification_type="CONTRACTOR",
                title=title,
                message=message,
                defaults={
                    "link": "/contractors/"
                }
            )

        elif document.expiry_date <= today + timedelta(days=30):

            title = "Contractor Document Expiring"

            message = (
                f"{document.get_document_type_display()} for "
                f"{document.contractor.company_name} expires on "
                f"{document.expiry_date}."
            )

            Notification.objects.get_or_create(
                recipient=user,
                notification_type="CONTRACTOR",
                title=title,
                message=message,
                defaults={
                    "link": "/contractors/"
                }
            )

@login_required
def notification_list(request):

    generate_notifications(request.user)

    notifications = Notification.objects.filter(
        recipient=request.user
    ).order_by("-created_at")

    return render(
        request,
        "notifications/notification_list.html",
        {
            "notifications": notifications,
        }
    )

@login_required
def notification_read(request, notification_id):

    notification = get_object_or_404(
        Notification,
        id=notification_id,
        recipient=request.user
    )

    notification.is_read = True
    notification.save()

    if notification.link:
        return redirect(notification.link)

    return redirect("notification_list")

@login_required
def mine_map(request):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]

    if request.user.role not in allowed_roles:
        return redirect("unauthorized")

    mines = Mine.objects.exclude(
        latitude__isnull=True
    ).exclude(
        longitude__isnull=True
    ).order_by("name")

    return render(
        request,
        "mines/mine_map.html",
        {
            "mines": mines,
        }
    )


@login_required
def risk_dashboard(request):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]

    if request.user.role not in allowed_roles:
        return redirect("unauthorized")

    mines = Mine.objects.all().order_by("-risk_score")

    risk_data = []

    for mine in mines:

       result = update_mine_risk(mine)
       ml_result = predict_mine_risk(mine)

       ai_result = generate_risk_explanation(
            result,
            ml_result
        )

    previous_record = (
        mine.risk_history
        .exclude(
            risk_score=result["score"],
            risk_level=result["level"]
        )
        .first()
    )

    if previous_record:

        risk_change = (
            float(result["score"])
            - float(previous_record.risk_score)
        )

    else:

        risk_change = 0

    risk_data.append({
        "mine": mine,
        "score": result["score"],
        "level": result["level"],
        "factors": result["factors"],
        "risk_change": risk_change,
        "ml_score": ml_result["score"],
        "ml_level": ml_result["level"],
        "explanations": ai_result["explanations"],
        "recommendations": ai_result["recommendations"],
    })

    return render(
        request,
        "risk/risk_dashboard.html",
        {
            "risk_data": risk_data,
        }
    )


@login_required
def mine_risk_history(request, mine_id):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "INSPECTOR",
        "SAFETY_OFFICER",
        "REGULATOR",
    ]

    if request.user.role not in allowed_roles:
        return redirect("unauthorized")

    mine = get_object_or_404(
        Mine,
        id=mine_id
    )

    history = mine.risk_history.all().order_by(
        "recorded_at"
    )

    return render(
        request,
        "risk/mine_risk_history.html",
        {
            "mine": mine,
            "history": history,
        }
    )

def analytics_dashboard(request):
    if not request.user.is_authenticated:
        return redirect("login")

    mines = Mine.objects.all()

    # Mine statistics
    total_mines = mines.count()
    active_mines = mines.filter(status="ACTIVE").count()
    inactive_mines = mines.filter(status="INACTIVE").count()
    maintenance_mines = mines.filter(status="MAINTENANCE").count()

    # Compliance statistics
    total_compliance = Compliance.objects.count()
    completed_compliance = Compliance.objects.filter(
        status="COMPLETED"
    ).count()

    pending_compliance = Compliance.objects.filter(
        status="PENDING"
    ).count()

    today = timezone.localdate()

    overdue_compliance = Compliance.objects.filter(
        status="PENDING",
        due_date__lt=today
    ).count()

    due_soon_compliance = Compliance.objects.filter(
        status="PENDING",
        due_date__gte=today,
        due_date__lte=today + timedelta(days=7)
    ).count()

    # Inspection statistics
    total_inspections = Inspection.objects.count()

    scheduled_inspections = Inspection.objects.filter(
        status="SCHEDULED"
    ).count()

    in_progress_inspections = Inspection.objects.filter(
        status="IN_PROGRESS"
    ).count()

    completed_inspections = Inspection.objects.filter(
        status="COMPLETED"
    ).count()

    cancelled_inspections = Inspection.objects.filter(
        status="CANCELLED"
    ).count()

    # Violation statistics
    total_violations = Violation.objects.count()

    open_violations = Violation.objects.filter(
        status="OPEN"
    ).count()

    in_progress_violations = Violation.objects.filter(
        status="IN_PROGRESS"
    ).count()

    resolved_violations = Violation.objects.filter(
        status="RESOLVED"
    ).count()

    closed_violations = Violation.objects.filter(
        status="CLOSED"
    ).count()

    critical_violations = Violation.objects.filter(
        severity="CRITICAL"
    ).count()

    high_violations = Violation.objects.filter(
        severity="HIGH"
    ).count()

    medium_violations = Violation.objects.filter(
        severity="MEDIUM"
    ).count()

    low_violations = Violation.objects.filter(
        severity="LOW"
    ).count()

    # Contractor statistics
    total_contractors = Contractor.objects.count()

    active_contractors = Contractor.objects.filter(
        status="ACTIVE"
    ).count()

    inactive_contractors = Contractor.objects.filter(
        status="INACTIVE"
    ).count()

    suspended_contractors = Contractor.objects.filter(
        status="SUSPENDED"
    ).count()

    # Contractor document statistics
    total_documents = ContractorDocument.objects.count()

    expired_documents = ContractorDocument.objects.filter(
        expiry_date__lt=today
    ).count()

    expiring_documents = ContractorDocument.objects.filter(
        expiry_date__gte=today,
        expiry_date__lte=today + timedelta(days=30)
    ).count()

    valid_documents = total_documents - expired_documents - expiring_documents

    # Risk statistics
    for mine in mines:
        update_mine_risk(mine)

    low_risk = Mine.objects.filter(
        risk_level="LOW"
    ).count()

    medium_risk = Mine.objects.filter(
        risk_level="MEDIUM"
    ).count()

    high_risk = Mine.objects.filter(
        risk_level="HIGH"
    ).count()

    critical_risk = Mine.objects.filter(
        risk_level="CRITICAL"
    ).count()

    context = {
        "total_mines": total_mines,
        "active_mines": active_mines,
        "inactive_mines": inactive_mines,
        "maintenance_mines": maintenance_mines,

        "total_compliance": total_compliance,
        "completed_compliance": completed_compliance,
        "pending_compliance": pending_compliance,
        "overdue_compliance": overdue_compliance,
        "due_soon_compliance": due_soon_compliance,

        "total_inspections": total_inspections,
        "scheduled_inspections": scheduled_inspections,
        "in_progress_inspections": in_progress_inspections,
        "completed_inspections": completed_inspections,
        "cancelled_inspections": cancelled_inspections,

        "total_violations": total_violations,
        "open_violations": open_violations,
        "in_progress_violations": in_progress_violations,
        "resolved_violations": resolved_violations,
        "closed_violations": closed_violations,

        "critical_violations": critical_violations,
        "high_violations": high_violations,
        "medium_violations": medium_violations,
        "low_violations": low_violations,

        "total_contractors": total_contractors,
        "active_contractors": active_contractors,
        "inactive_contractors": inactive_contractors,
        "suspended_contractors": suspended_contractors,

        "total_documents": total_documents,
        "valid_documents": valid_documents,
        "expiring_documents": expiring_documents,
        "expired_documents": expired_documents,

        "low_risk": low_risk,
        "medium_risk": medium_risk,
        "high_risk": high_risk,
        "critical_risk": critical_risk,
    }

    return render(
        request,
        "analytics/analytics_dashboard.html",
        context
    )