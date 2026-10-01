from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.shortcuts import redirect, render
from mines.risk_engine import calculate_mine_risk
User = get_user_model()
from django.contrib.auth import login
from django.shortcuts import redirect
from .models import User
from django.contrib.auth import logout

from datetime import date, timedelta

from mines.models import (
    Compliance,
    Contractor,
    ContractorDocument,
    Inspection,
    Mine,
    Violation,
)

def landing(request):
    if request.user.is_authenticated:
        return redirect("dashboard")

    total_mines = Mine.objects.count()
    total_compliance = Compliance.objects.count()
    completed_compliance = Compliance.objects.filter(status="COMPLETED").count()
    compliance_rate = (
        round(completed_compliance / total_compliance * 100)
        if total_compliance else 0
    )
    inspections_done = Inspection.objects.filter(status="COMPLETED").count()
    open_violations = Violation.objects.filter(
        status__in=["OPEN", "IN_PROGRESS"]
    ).count()

    return render(request, "landing/landing.html", {
        "total_mines": total_mines,
        "compliance_rate": compliance_rate,
        "inspections_done": inspections_done,
        "open_violations": open_violations,
    })


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

    from mines.models import AuditLog

    recent_audits = AuditLog.objects.select_related("user").order_by(
        "-created_at"
    )[:6]

    critical_open = Violation.objects.filter(
        severity="CRITICAL",
        status__in=["OPEN", "IN_PROGRESS"],
    ).count()

    live_alerts = []
    if overdue_compliance:
        live_alerts.append({
            "title": "Overdue compliance",
            "count": overdue_compliance,
            "detail": "Requirements past their due date need immediate action.",
        })
    if critical_open:
        live_alerts.append({
            "title": "Open critical violations",
            "count": critical_open,
            "detail": "Critical-severity violations awaiting resolution.",
        })
    if expired_documents:
        live_alerts.append({
            "title": "Expired contractor documents",
            "count": expired_documents,
            "detail": "Renew documents before operations are affected.",
        })

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
        "recent_audits": recent_audits,
        "live_alerts": live_alerts,
        # Scale denominator for the CSS overview bars (never zero).
        "issue_total": max(
            1,
            overdue_compliance + open_violations
            + upcoming_inspections + expired_documents,
        ),
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

    total_mines = Mine.objects.count()

    active_mines = Mine.objects.filter(
        status="ACTIVE"
    ).count()

    open_violations = Violation.objects.filter(
        status__in=["OPEN", "IN_PROGRESS"]
    ).count()

    overdue_compliance = Compliance.objects.filter(
        status="PENDING",
        due_date__lt=date.today()
    ).count()

    context = {
        "total_mines": total_mines,
        "active_mines": active_mines,
        "open_violations": open_violations,
        "overdue_compliance": overdue_compliance,
    }

    return render(
        request,
        "dashboards/manager.html",
        context
    )


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



def demo_login(request, role):
    import os

    # Password-less demo login is only allowed in DEBUG mode or when
    # explicitly enabled. Never enable ALLOW_DEMO_LOGIN in production.
    allow_demo = os.environ.get("ALLOW_DEMO_LOGIN", "") == "True"
    from django.conf import settings as _settings

    if not (_settings.DEBUG or allow_demo):
        return redirect("login")

    demo_users = {
        "admin": "admin",
        "manager": "manager1",
        "inspector": "inspector1",
        "safety": "safety1",
        "contractor": "contractor1",
        "regulator": "regulator1",
    }

    username = demo_users.get(role)

    if not username:
        return redirect("login")

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return redirect("login")

    login(request, user)

    if user.role == "ADMIN":
        return redirect("admin_dashboard")

    if user.role == "MANAGER":
        return redirect("manager_dashboard")

    if user.role == "INSPECTOR":
        return redirect("inspector_dashboard")

    if user.role == "SAFETY_OFFICER":
        return redirect("safety_dashboard")

    if user.role == "CONTRACTOR":
        return redirect("contractor_dashboard")

    if user.role == "REGULATOR":
        return redirect("regulator_dashboard")

    return redirect("unauthorized")


def logout_view(request):
    logout(request)
    return redirect("login")