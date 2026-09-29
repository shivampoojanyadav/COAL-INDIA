from django.urls import path
from . import views

urlpatterns = [
    path("", views.inspection_list, name="inspection_list"),
    path("add/", views.inspection_create, name="inspection_create"),
    path(
        "<int:inspection_id>/",
        views.inspection_detail,
        name="inspection_detail"
    ),
]