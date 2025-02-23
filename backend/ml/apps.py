# ml/apps.py
from django.apps import AppConfig
from django.conf import settings
from transformers import pipeline
import torch

class MLConfig(AppConfig):
    name = 'ml'

    def ready(self):
        if not hasattr(settings, 'ZERO_SHOT_PIPELINE'):
            try:
                # Device detection for Apple Silicon, CUDA, and CPU
                if torch.backends.mps.is_available():
                    device = torch.device('mps')  # Apple Neural Engine
                    device_name = "Apple Neural Engine (MPS)"
                elif torch.cuda.is_available():
                    device = 0  # CUDA device index
                    device_name = "NVIDIA GPU (CUDA)"
                else:
                    device = -1  # CPU fallback
                    device_name = "CPU"

                # Initialize pipeline with automatic device selection
                settings.ZERO_SHOT_PIPELINE = pipeline(
                    task="zero-shot-classification",
                    model="MoritzLaurer/deberta-v3-large-zeroshot-v2.0",
                    device=device
                )

                print(f"Zero-shot pipeline loaded on {device_name}")

            except Exception as e:
                print(f"Pipeline initialization failed: {str(e)}")
                raise