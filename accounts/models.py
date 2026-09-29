from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        MANAGER = "MANAGER", "Mine Manager"
        INSPECTOR = "INSPECTOR", "Inspector"
        SAFETY_OFFICER = "SAFETY_OFFICER", "Safety Officer"
        CONTRACTOR = "CONTRACTOR", "Contractor"
        REGULATOR = "REGULATOR", "Regulatory Officer"

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.INSPECTOR
    )

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"