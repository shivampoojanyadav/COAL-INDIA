from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):

    help = "Create demo users for COALiZEN"

    def handle(self, *args, **kwargs):

        users = [
            {
                "username": "admin",
                "email": "admin@minegov.local",
                "role": "ADMIN",
            },
            {
                "username": "manager1",
                "email": "manager@minegov.local",
                "role": "MANAGER",
            },
            {
                "username": "inspector1",
                "email": "inspector@minegov.local",
                "role": "INSPECTOR",
            },
            {
                "username": "safety1",
                "email": "safety@minegov.local",
                "role": "SAFETY_OFFICER",
            },
            {
                "username": "contractor1",
                "email": "contractor@minegov.local",
                "role": "CONTRACTOR",
            },
            {
                "username": "regulator1",
                "email": "regulator@minegov.local",
                "role": "REGULATOR",
            },
        ]

        password = "MineGov@123"

        for data in users:

            user, created = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "role": data["role"],
                }
            )

            if created:
                user.set_password(password)
                user.save()

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created {data['role']}: {data['username']}"
                    )
                )

            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"{data['username']} already exists"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Demo users setup completed."
            )
        )