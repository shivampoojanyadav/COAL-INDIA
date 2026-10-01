import csv
import os

from django.core.management.base import BaseCommand

from mines.ml.dataset import build_mine_dataset


class Command(BaseCommand):

    help = "Generate the CoaliZEN ML training dataset"

    def handle(self, *args, **options):

        dataset = build_mine_dataset()

        if not dataset:

            self.stdout.write(
                self.style.WARNING(
                    "No mine data available."
                )
            )

            return

        ml_directory = "ml_data"

        os.makedirs(
            ml_directory,
            exist_ok=True
        )

        file_path = os.path.join(
            ml_directory,
            "mine_risk_dataset.csv"
        )

        fieldnames = dataset[0].keys()

        with open(
            file_path,
            "w",
            newline="",
            encoding="utf-8"
        ) as csv_file:

            writer = csv.DictWriter(
                csv_file,
                fieldnames=fieldnames
            )

            writer.writeheader()

            writer.writerows(dataset)

        self.stdout.write(
            self.style.SUCCESS(
                f"ML dataset generated successfully: {file_path}"
            )
        )