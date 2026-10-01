"""
URL configuration for MineGov project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path, include

from accounts import views


urlpatterns = [

    path(
        "admin/",
        admin.site.urls
    ),

    path(
        "",
        views.landing,
        name="landing"
    ),

    path(
        "login/",
        auth_views.LoginView.as_view(
            template_name="accounts/login.html"
        ),
        name="login"
    ),


    path(
        "dashboard/",
        views.dashboard_redirect,
        name="dashboard"
    ),

    path(
        "dashboard/admin/",
        views.admin_dashboard,
        name="admin_dashboard"
    ),

    path(
        "dashboard/manager/",
        views.manager_dashboard,
        name="manager_dashboard"
    ),

    path(
        "dashboard/inspector/",
        views.inspector_dashboard,
        name="inspector_dashboard"
    ),

    path(
        "dashboard/safety/",
        views.safety_dashboard,
        name="safety_dashboard"
    ),

    path(
        "dashboard/contractor/",
        views.contractor_dashboard,
        name="contractor_dashboard"
    ),

    path(
        "dashboard/regulator/",
        views.regulator_dashboard,
        name="regulator_dashboard"
    ),

    path(
        "unauthorized/",
        views.unauthorized,
        name="unauthorized"
    ),

    path(
    "mines/",
    include("mines.urls")
    ),

    path(
    "compliance/",
    include("mines.compliance_urls")
    ),

    path(
    "inspections/",
    include("mines.inspection_urls")
    ),

    path(
    "violations/",
    include("mines.violation_urls")
    ),

    path(
    "contractors/",
    include("mines.contractor_urls")
    ),

    path(
    "notifications/",
    include("mines.notification_urls")
    ),

    path(
    "risk/",
    include("mines.risk_urls")
    ),

    path("analytics/", include("mines.analytics_urls")),

    path(
    "assistant/",
    include("mines.assistant_urls")
    ),

    path(
    "audit/",
    include("mines.audit_urls")
    ),

    path(
    "demo/<str:role>/",
    views.demo_login,
    name="demo_login"
    ),

    path(
    "logout/",
    views.logout_view,
    name="logout"
    ),
    
]