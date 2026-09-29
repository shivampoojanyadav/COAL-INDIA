from django.urls import path

from . import views


urlpatterns = [

    path(
        "",
        views.compliance_list,
        name="compliance_list"
    ),

    path(
        "add/",
        views.compliance_create,
        name="compliance_create"
    ),

]