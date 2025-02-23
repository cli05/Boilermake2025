# ml/apps.py
from django.apps import AppConfig
from django.conf import settings
from transformers import pipeline
import torch


class MLConfig(AppConfig):
    name = 'ml'

    def ready(self):
        # Load only once during server startup
        if not hasattr(settings, 'ZERO_SHOT_PIPELINE'):
            try:
                # Detect available hardware
                device = 0 if torch.cuda.is_available() else -1

                # Initialize pipeline
                settings.ZERO_SHOT_PIPELINE = pipeline(
                    task="zero-shot-classification",
                    model="MoritzLaurer/deberta-v3-large-zeroshot-v2.0",
                    device=device
                )

                print(f"Zero-shot pipeline loaded on {'GPU' if device == 0 else 'CPU'}")

            except Exception as e:
                print(f"Pipeline initialization failed: {str(e)}")
                raise
