# ==========================================
# TRYONIX - AI INFERENCE CONFIGURATION
# ==========================================

import os
from pathlib import Path
from dotenv import load_dotenv

# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]

ENV_FILE = PROJECT_ROOT / ".env"

load_dotenv(
    dotenv_path=ENV_FILE,
    override=False
)

# ==========================================
# GPU INFERENCE CONFIGURATION
# ==========================================

AI_INFERENCE_URL = os.getenv(
    "AI_INFERENCE_URL",
    ""
).strip().rstrip("/")

AI_REQUEST_TIMEOUT = 180

SUPPORTED_CLOTHING_TYPES = [
    "upper",
    "lower",
    "overall"
]

AI_MODEL_NAME = "CatVTON"

AI_INFERENCE_ENABLED = bool(AI_INFERENCE_URL)