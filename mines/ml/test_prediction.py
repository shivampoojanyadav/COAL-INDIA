import os
import sys

import django


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

sys.path.append(BASE_DIR)

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "MineGov.settings"
)

django.setup()


from mines.models import Mine
from mines.ml.predict import predict_mine_risk


mine = Mine.objects.first()

if mine:

    result = predict_mine_risk(mine)

    print("Mine:", mine.name)
    print("Predicted Risk Score:", result["score"])
    print("Predicted Risk Level:", result["level"])

else:

    print("No mines found.")