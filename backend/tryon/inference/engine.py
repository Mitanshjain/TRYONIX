
# ==========================================
# TRYONIX - CATVTON GPU INFERENCE ENGINE
# ==========================================

import logging
import mimetypes
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv


# ==========================================
# ENVIRONMENT CONFIGURATION
# ==========================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Render environment variables take priority.
load_dotenv(
    dotenv_path=PROJECT_ROOT / ".env",
    override=False,
)

from backend.tryon.inference.config import (
    AI_INFERENCE_URL,
    AI_REQUEST_TIMEOUT,
    SUPPORTED_CLOTHING_TYPES,
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
    Connects TRYONIX FastAPI backend to the
    Kaggle CatVTON GPU inference service.

    Endpoints:
        GET  /health
        POST /generate

    Authentication:
        x-api-key: AI_INFERENCE_API_KEY

    Multipart fields:
        person_image
        garment_image
        clothing_type
    """

    def __init__(self):

        self.api_url = (
            AI_INFERENCE_URL.strip().rstrip("/")
        )

        self.timeout = max(
            float(AI_REQUEST_TIMEOUT),
            180.0,
        )

        self.api_key = os.getenv(
            "AI_INFERENCE_API_KEY", ""
        ).strip()

        logger.info(
            "CatVTON initialized | "
            "url_configured=%s | "
            "key_configured=%s | "
            "key_length=%s",
            bool(self.api_url),
            bool(self.api_key),
            len(self.api_key),
        )

        if not self.api_url:
            logger.warning(
                "AI_INFERENCE_URL is missing."
            )

        if not self.api_key:
            logger.warning(
                "AI_INFERENCE_API_KEY is missing."
            )

    # ==========================================
    # VALIDATE CONFIGURATION
    # ==========================================

    def validate_configuration(self):

        if not self.api_url:
            raise RuntimeError(
                "AI_INFERENCE_URL is not configured."
            )

        if not self.api_url.startswith(
            ("http://", "https://")
        ):
            raise RuntimeError(
                "Invalid AI_INFERENCE_URL."
            )

        if not self.api_key:
            raise RuntimeError(
                "AI_INFERENCE_API_KEY is not configured."
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
        # STEP 1: VALIDATE CONFIGURATION
        # --------------------------------------

        self.validate_configuration()

        # --------------------------------------
        # STEP 2: VALIDATE CLOTHING TYPE
        # --------------------------------------

        clothing_type = (
            clothing_type.strip().lower()
        )

        if clothing_type not in SUPPORTED_CLOTHING_TYPES:
            raise ValueError(
                f"Unsupported clothing type: {clothing_type}"
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
        # STEP 4: DETECT MIME TYPES
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
        # STEP 5: AUTHENTICATION HEADER
        # --------------------------------------

        headers = {
            "x-api-key": self.api_key,
            "Accept": "image/png",
        }

        logger.info(
            "TRYONIX -> CatVTON | "
            "category=%s | "
            "endpoint=/generate | "
            "authentication_configured=%s",
            clothing_type,
            bool(self.api_key),
        )

        # --------------------------------------
        # STEP 6: HTTP TIMEOUT
        # --------------------------------------

        timeout_config = httpx.Timeout(
            connect=30.0,
            read=self.timeout,
            write=120.0,
            pool=30.0,
        )

        # --------------------------------------
        # STEP 7: SEND REQUEST TO GPU
        # --------------------------------------

        try:

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

            # ----------------------------------
            # STEP 8: HANDLE AUTHENTICATION
            # ----------------------------------

            if response.status_code == 401:

                logger.error(
                    "CatVTON authentication failed | "
                    "HTTP 401 | "
                    "Check AI_INFERENCE_API_KEY "
                    "on Render and Kaggle."
                )

                raise RuntimeError(
                    "GPU authentication failed. "
                    "Check AI_INFERENCE_API_KEY."
                )

            # ----------------------------------
            # STEP 9: HANDLE OTHER HTTP ERRORS
            # ----------------------------------

            response.raise_for_status()

        # --------------------------------------
        # STEP 10: TIMEOUT HANDLING
        # --------------------------------------

        except httpx.TimeoutException as exc:

            logger.exception(
                "CatVTON GPU inference timed out."
            )

            raise RuntimeError(
                "Virtual try-on timed out."
            ) from exc

        # --------------------------------------
        # STEP 11: HTTP ERROR HANDLING
        # --------------------------------------

        except httpx.HTTPStatusError as exc:

            logger.error(
                "CatVTON HTTP error | "
                "status=%s | response=%s",
                exc.response.status_code,
                exc.response.text[:500],
            )

            raise RuntimeError(
                "GPU inference failed with HTTP "
                f"{exc.response.status_code}"
            ) from exc

        # --------------------------------------
        # STEP 12: CONNECTION ERROR HANDLING
        # --------------------------------------

        except httpx.RequestError as exc:

            logger.exception(
                "CatVTON connection failed | "
                "error_type=%s",
                type(exc).__name__,
            )

            raise RuntimeError(
                "GPU service is unavailable."
            ) from exc

        # --------------------------------------
        # STEP 13: VALIDATE RESPONSE
        # --------------------------------------

        content_type = response.headers.get(
            "content-type", ""
        ).lower()

        if not content_type.startswith("image/png"):

            logger.error(
                "Unexpected GPU response | "
                "content_type=%s | status=%s",
                content_type,
                response.status_code,
            )

            raise RuntimeError(
                "GPU returned an unexpected response."
            )

        if not response.content:

            logger.error(
                "CatVTON returned empty image."
            )

            raise RuntimeError(
                "GPU returned an empty image."
            )

        # --------------------------------------
        # STEP 14: SUCCESS
        # --------------------------------------

        logger.info(
            "TRYONIX virtual try-on generated | "
            "bytes=%s | clothing_type=%s",
            len(response.content),
            clothing_type,
        )

        return response.content


# ==========================================
# GLOBAL ENGINE INSTANCE
# ==========================================

tryon_engine = TryOnInferenceEngine()
