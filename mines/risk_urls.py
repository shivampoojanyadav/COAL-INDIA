from django.urls import path
from . import views

urlpatterns = [

    path(
        "",
        views.risk_dashboard,
        name="risk_dashboard"
    ),

    path(
        "mine/<int:mine_id>/",
        views.mine_risk_history,
        name="mine_risk_history"
    ),

]