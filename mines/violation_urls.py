from django.urls import path
from . import views

urlpatterns = [
    path(
        "",
        views.violation_list,
        name="violation_list"
    ),

    path(
        "add/",
        views.violation_create,
        name="violation_create"
    ),

    path(
        "<int:violation_id>/",
        views.violation_detail,
        name="violation_detail"
    ),
]