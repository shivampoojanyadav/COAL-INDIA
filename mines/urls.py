from django.urls import path

from . import views
from .views import mine_compliance_report

urlpatterns = [

    path(
        "",
        views.mine_list,
        name="mine_list"
    ),

    path(
        "add/",
        views.mine_create,
        name="mine_create"
    ),

    path(
        "<int:mine_id>/edit/",
        views.mine_edit,
        name="mine_edit"
    ),

    path(
        "<int:mine_id>/delete/",
        views.mine_delete,
        name="mine_delete"
    ),

    # NOTE: static routes must come before <int:mine_id>/ patterns.
    path("map/", views.mine_map, name="mine_map"),

    path(
        "<int:mine_id>/",
        views.mine_detail,
        name="mine_detail"
    ),

    path(
    "<int:mine_id>/compliance-report/",
    mine_compliance_report,
    name="mine_compliance_report",
    ),



]