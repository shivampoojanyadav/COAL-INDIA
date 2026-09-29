from django.urls import path
from . import views

urlpatterns = [

    path(
        "",
        views.contractor_list,
        name="contractor_list"
    ),

    path(
        "add/",
        views.contractor_create,
        name="contractor_create"
    ),

    path(
        "documents/add/",
        views.contractor_document_create,
        name="contractor_document_create"
    ),

    path(
        "<int:contractor_id>/",
        views.contractor_detail,
        name="contractor_detail"
    ),
]