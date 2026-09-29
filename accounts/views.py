from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.shortcuts import redirect, render
from mines.risk_engine import calculate_mine_risk
User = get_user_model()

from datetime import date, timedelta

from mines.models import (
    Compliance,
    Contractor,
    ContractorDocument,
    Inspection,
    Mine,
    Violation,
)

@login_required
def dashboard_redirect(request):
    user = request.user

    if user.role == "ADMIN":
        return redirect("admin_dashboard")

    elif user.role == "MANAGER":
        return redirect("manager_dashboard")

    elif user.role == "INSPECTOR":
        return redirect("inspector_dashboard")

    elif user.role == "SAFETY_OFFICER":
        return redirect("safety_dashboard")

    elif user.role == "CONTRACTOR":
        return redirect("contractor_dashboard")

    elif user.role == "REGULATOR":
        return redirect("regulator_dashboard")

    return redirect("login")


@login_required
def admin_dashboard(request):

    if request.user.role != "ADMIN":
        return redirect("unauthorized")

    today = date.today()

    total_mines = Mine.objects.count()

    active_mines = Mine.objects.filter(
        status=Mine.Status.ACTIVE
    ).count()

    inactive_mines = Mine.objects.filter(
        status=Mine.Status.INACTIVE
    ).count()

    maintenance_mines = Mine.objects.filter(
        status=Mine.Status.MAINTENANCE
    ).count()

    active_users = User.objects.filter(
        is_active=True
    ).count()

    open_violations = Violation.objects.filter(
        status__in=["OPEN", "IN_PROGRESS"]
    ).count()

    overdue_compliance = Compliance.objects.filter(
        status="PENDING",
        due_date__lt=today
    ).count()

    upcoming_inspections = Inspection.objects.filter(
        status="SCHEDULED",
        inspection_date__gte=today
    ).count()

    active_contractors = Contractor.objects.filter(
        status=Contractor.Status.ACTIVE
    ).count()

    expired_documents = ContractorDocument.objects.filter(
        expiry_date__lt=today
    ).count()

    risk_summary = {
    "LOW": 0,
    "MEDIUM": 0,
    "HIGH": 0,
    "CRITICAL": 0,
    }

    for mine in Mine.objects.all():

        result = calculate_mine_risk(mine)

        risk_summary[result["level"]] += 1

    context = {
        "total_mines": total_mines,
        "active_mines": active_mines,
        "inactive_mines": inactive_mines,
        "maintenance_mines": maintenance_mines,
        "active_users": active_users,
        "open_violations": open_violations,
        "overdue_compliance": overdue_compliance,
        "upcoming_inspections": upcoming_inspections,
        "active_contractors": active_contractors,
        "expired_documents": expired_documents,
        "risk_summary": risk_summary,
    }

    return render(
        request,
        "dashboards/admin.html",
        context
    )


@login_required
def manager_dashboard(request):
    if request.user.role != "MANAGER":
        return redirect("unauthorized")

    return render(request, "dashboards/manager.html")


@login_required
def inspector_dashboard(request):
    if request.user.role != "INSPECTOR":
        return redirect("unauthorized")

    return render(request, "dashboards/inspector.html")


@login_required
def safety_dashboard(request):
    if request.user.role != "SAFETY_OFFICER":
        return redirect("unauthorized")

    return render(request, "dashboards/safety.html")


@login_required
def contractor_dashboard(request):
    if request.user.role != "CONTRACTOR":
        return redirect("unauthorized")

    return render(request, "dashboards/contractor.html")


@login_required
def regulator_dashboard(request):
    if request.user.role != "REGULATOR":
        return redirect("unauthorized")

    return render(request, "dashboards/regulator.html")


@login_required
def unauthorized(request):
    return render(request, "dashboards/unauthorized.html", status=403)