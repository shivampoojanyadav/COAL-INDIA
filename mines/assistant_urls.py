from django.urls import path
from .views import ai_assistant

urlpatterns = [
    path("", ai_assistant, name="ai_assistant"),
]