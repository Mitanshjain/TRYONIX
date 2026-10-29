
# ==========================================
# TRYONIX - CATVTON GPU INFERENCE ENGINE
# ==========================================

import logging
import os
import mimetypes
from pathlib import Path

import httpx

from backend.tryon.inference.config import (
    AI_INFERENCE_URL,
    AI_REQUEST_TIMEOUT,
    SUPPORTED_CLOTHING_TYPES,
)

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]

load_dotenv(
    dotenv_path=PROJECT_ROOT / ".env",
    override=True,
)


# ==========================================
# LOGGER
# ==========================================

logger = logging.getLogger(__name__)


# ==========================================
# CATVTON INFERENCE ENGINE
# ==========================================

class TryOnInferenceEngine:
    """
    Connects the TRYONIX FastAPI backend
    to the Kaggle CatVTON GPU inference API.

    GPU API:
        GET  /health
        POST /generate

    Required multipart fields:
        person_image
        garment_image

    Optional form field:
        clothing_type
    """

    def __init__(self):

        self.api_url = AI_INFERENCE_URL.strip().rstrip("/")

        self.timeout = max(
            float(AI_REQUEST_TIMEOUT),
            180.0,
        )

        self.api_key = os.getenv(
            "AI_INFERENCE_API_KEY",
            "",
        )

        logger.info(
            "CatVTON inference engine initialized | configured=%s",
            bool(self.api_url),
        )

    # ==========================================
    # GENERATE VIRTUAL TRY-ON
    # ==========================================

    async def generate_tryon(
        self,
        person_image_path: str,
        garment_image_path: str,
        clothing_type: str = "upper",
    ) -> bytes:

        # --------------------------------------
        # STEP 1: VALIDATE CLOTHING CATEGORY
        # --------------------------------------

        if clothing_type not in SUPPORTED_CLOTHING_TYPES:
            raise ValueError(
                f"Unsupported clothing type: {clothing_type}"
            )

        # --------------------------------------
        # STEP 2: VALIDATE GPU CONFIGURATION
        # --------------------------------------

        if not self.api_url:
            raise RuntimeError(
                "AI_INFERENCE_URL is not configured."
            )

        # --------------------------------------
        # STEP 3: VALIDATE IMAGE PATHS
        # --------------------------------------

        person_path = Path(person_image_path)
        garment_path = Path(garment_image_path)

        if not person_path.is_file():
            raise FileNotFoundError(
                f"Person image not found: {person_path}"
            )

        if not garment_path.is_file():
            raise FileNotFoundError(
                f"Garment image not found: {garment_path}"
            )

        # --------------------------------------
        # STEP 4: DETECT IMAGE MIME TYPES
        # --------------------------------------

        person_mime = (
            mimetypes.guess_type(person_path.name)[0]
            or "image/jpeg"
        )

        garment_mime = (
            mimetypes.guess_type(garment_path.name)[0]
            or "image/jpeg"
        )

        # --------------------------------------
        # STEP 5: PREPARE REQUEST HEADERS
        # --------------------------------------

        # ==========================================
        # GPU API AUTHENTICATION
        # ==========================================

        headers = {}

        if self.api_key:
            headers["x-api-key"] = self.api_key




        logger.info(
            "TRYONIX -> CatVTON | category=%s | endpoint=/generate",
            clothing_type,
        )

        # --------------------------------------
        # STEP 6: SEND IMAGES TO KAGGLE GPU
        # --------------------------------------

        try:

            timeout_config = httpx.Timeout(
                connect=30.0,
                read=self.timeout,
                write=120.0,
                pool=30.0,
            )

            async with httpx.AsyncClient(
                timeout=timeout_config,
                follow_redirects=False,
            ) as client:

                with (
                    person_path.open("rb") as person_file,
                    garment_path.open("rb") as garment_file,
                ):

                    response = await client.post(
                        f"{self.api_url}/generate",
                        headers=headers,
                        files={
                            "person_image": (
                                person_path.name,
                                person_file,
                                person_mime,
                            ),
                            "garment_image": (
                                garment_path.name,
                                garment_file,
                                garment_mime,
                            ),
                        },
                        data={
                            "clothing_type": clothing_type,
                        },
                    )

                # Raise exception for HTTP 4xx/5xx
                response.raise_for_status()

        # --------------------------------------
        # STEP 7: HANDLE TIMEOUT
        # --------------------------------------

        except httpx.TimeoutException as exc:

            logger.exception(
                "CatVTON inference timed out"
            )

            raise RuntimeError(
                "Virtual try-on timed out."
            ) from exc

        # --------------------------------------
        # STEP 8: HANDLE GPU HTTP ERRORS
        # --------------------------------------

        except httpx.HTTPStatusError as exc:

            logger.error(
                "CatVTON GPU HTTP %s | Response: %s",
                exc.response.status_code,
                exc.response.text[:1000],
            )

            raise RuntimeError(
                "GPU inference failed with HTTP "
                f"{exc.response.status_code}"
            ) from exc

        # --------------------------------------
        # STEP 9: HANDLE CONNECTION ERRORS
        # --------------------------------------

        except httpx.RequestError as exc:

            logger.exception(
                "CatVTON GPU connection failed | type=%s | details=%r",
                type(exc).__name__,
                exc,
            )

            raise RuntimeError(
                "GPU service is unavailable."
            ) from exc

        # --------------------------------------
        # STEP 10: VALIDATE GENERATED IMAGE
        # --------------------------------------

        content_type = response.headers.get(
            "content-type",
            "",
        ).lower()

        if not content_type.startswith("image/png"):
            logger.error(
                "Unexpected GPU response | content-type=%s | body=%s",
                content_type,
                response.content[:300],
            )

            raise RuntimeError(
                "GPU returned an unexpected response."
            )

        if not response.content:
            raise RuntimeError(
                "GPU returned an empty image."
            )

        # --------------------------------------
        # STEP 11: SUCCESS
        # --------------------------------------

        logger.info(
            "TRYONIX virtual try-on generated successfully | bytes=%s",
            len(response.content),
        )

        return response.content


# ==========================================
# GLOBAL INFERENCE ENGINE INSTANCE
# ==========================================

tryon_engine = TryOnInferenceEngine()
