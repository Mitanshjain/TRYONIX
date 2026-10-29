
# ==========================================
# TRYONIX - VIRTUAL TRY-ON ROUTES
# ==========================================

import ipaddress
import logging
import socket

from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

import httpx

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from fastapi.responses import Response

from PIL import (
    Image,
    ImageOps,
    UnidentifiedImageError,
)

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import Product
from backend.tryon.inference.engine import tryon_engine


# ==========================================
# LOGGER
# ==========================================

logger = logging.getLogger(__name__)


# ==========================================
# ROUTER CONFIGURATION
# ==========================================

router = APIRouter(
    prefix="/tryon",
    tags=["Virtual Try-On"],
)

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_GARMENT_DOWNLOAD_SIZE = 20 * 1024 * 1024
MAX_GARMENT_PIXELS = 25_000_000
GARMENT_MAX_DIMENSION = 1024

ALLOWED_FORMATS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

Image.MAX_IMAGE_PIXELS = MAX_GARMENT_PIXELS


# ==========================================
# DATABASE SESSION
# ==========================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ==========================================
# REQUEST SCHEMA
# ==========================================

class TryOnPrepareRequest(BaseModel):
    image_id: str = Field(min_length=1, max_length=100)
    product_id: int = Field(gt=0)


# ==========================================
# VALIDATE UPLOADED PERSON IMAGE
# ==========================================

def get_uploaded_person_path(image_id: str) -> Path:

    try:
        image_uuid, extension = image_id.rsplit(".", 1)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid image identifier.",
        ) from exc

    if (
        len(image_uuid) != 32
        or any(
            char not in "0123456789abcdef"
            for char in image_uuid
        )
        or f".{extension}" not in ALLOWED_FORMATS.values()
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid image identifier.",
        )

    image_path = UPLOAD_DIR / image_id

    if not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded person image not found.",
        )

    return image_path


# ==========================================
# FETCH ACTIVE PRODUCT
# ==========================================

def get_active_product(db: Session, product_id: int):

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.is_active.is_(True),
        )
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Selected product not found.",
        )

    if not product.image_url:
        raise HTTPException(
            status_code=400,
            detail="Selected product has no garment image.",
        )

    return product


# ==========================================
# DETECT CLOTHING TYPE
# ==========================================

def detect_clothing_type(product) -> str:
    """
    Convert TRYONIX product information into
    CatVTON mask categories:

    upper   -> shirts, jackets, hoodies
    lower   -> jeans, cargos, trousers
    overall -> dresses, jumpsuits
    """

    name = str(
        getattr(product, "name", "") or ""
    ).lower().strip()

    category = str(
        getattr(product, "category", "") or ""
    ).lower().strip()

    combined = f"{name} {category}"

    # Full-body clothing
    overall_keywords = (
        "jumpsuit",
        "romper",
        "overall",
        "dress",
        "bodysuit",
    )

    # Lower-body clothing
    lower_keywords = (
        "cargo",
        "cargos",
        "jeans",
        "jean",
        "denim",
        "pants",
        "pant",
        "trousers",
        "trouser",
        "joggers",
        "jogger",
        "shorts",
        "short",
        "leggings",
        "legging",
        "skirt",
        "chinos",
        "chino",
        "bottomwear",
        "bottom wear",
        "bottoms",
        "lower wear",
        "lowerwear",
    )

    if any(
        keyword in combined
        for keyword in overall_keywords
    ):
        clothing_type = "overall"

    elif any(
        keyword in combined
        for keyword in lower_keywords
    ):
        clothing_type = "lower"

    else:
        clothing_type = "upper"

    logger.warning(
        "TRYONIX CATEGORY DETECTION | "
        "Product=%s | Category=%s | Result=%s",
        name,
        category,
        clothing_type,
    )

    return clothing_type


# ==========================================
# VALIDATE GARMENT IMAGE URL
# ==========================================

def validate_garment_url(url: str) -> None:

    parsed = urlparse(url)

    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
    ):
        raise ValueError("Invalid garment image URL.")

    try:
        port = parsed.port or (
            443 if parsed.scheme == "https" else 80
        )
    except ValueError as exc:
        raise ValueError("Invalid garment URL port.") from exc

    if port not in (80, 443):
        raise ValueError(
            "Garment image URL uses a disallowed port."
        )

    try:
        addresses = socket.getaddrinfo(
            parsed.hostname,
            port,
            type=socket.SOCK_STREAM,
        )

    except socket.gaierror as exc:
        raise ValueError(
            "Garment image hostname could not be resolved."
        ) from exc

    if not addresses:
        raise ValueError(
            "Garment image hostname has no address."
        )

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])

        if not ip.is_global:
            raise ValueError(
                "Garment image URL points to an unsafe address."
            )



# ==========================================
# PREPARE LOCAL PRODUCT IMAGE
# ==========================================

def prepare_local_garment(
    image_url: str,
    destination: Path,
) -> None:

    # Only allow product images inside frontend/public/products
    if not image_url.startswith("/products/"):
        raise ValueError("Invalid local product image path.")

    project_root = Path(__file__).resolve().parents[2]

    products_dir = (
        project_root / "frontend" / "public" / "products"
    ).resolve()

    relative_path = image_url.removeprefix("/products/")

    source_path = (products_dir / relative_path).resolve()

    # Prevent path traversal outside the products directory
    if not source_path.is_relative_to(products_dir):
        raise ValueError("Unsafe product image path.")

    if not source_path.is_file():
        raise ValueError("Local product image not found.")

    if source_path.stat().st_size > MAX_GARMENT_DOWNLOAD_SIZE:
        raise ValueError("Product image exceeds size limit.")

    with Image.open(source_path) as source:

        if source.format not in ALLOWED_FORMATS:
            raise ValueError("Unsupported product image format.")

        if source.width * source.height > MAX_GARMENT_PIXELS:
            raise ValueError("Product image dimensions are too large.")

        image = ImageOps.exif_transpose(source).convert("RGB")

        image.thumbnail(
            (GARMENT_MAX_DIMENSION, GARMENT_MAX_DIMENSION),
            Image.Resampling.LANCZOS,
        )

        image.save(
            destination,
            format="JPEG",
            quality=88,
            optimize=True,
        )

    logger.info("TRYONIX local garment prepared: %s", source_path)



# ==========================================
# DOWNLOAD AND OPTIMIZE GARMENT
# ==========================================

async def download_and_prepare_garment(
    image_url: str,
    destination: Path,
) -> None:

    validate_garment_url(image_url)

    async with httpx.AsyncClient(
        timeout=30,
        follow_redirects=False,
        trust_env=False,
    ) as client:

        async with client.stream(
            "GET",
            image_url,
        ) as response:

            if 300 <= response.status_code < 400:
                raise ValueError(
                    "Garment image redirects are not supported."
                )

            response.raise_for_status()

            length = response.headers.get(
                "content-length"
            )

            if length:
                try:
                    content_length = int(length)
                except ValueError as exc:
                    raise ValueError(
                        "Invalid garment response length."
                    ) from exc

                if content_length > MAX_GARMENT_DOWNLOAD_SIZE:
                    raise ValueError(
                        "Garment image exceeds 20 MB limit."
                    )

            image_data = bytearray()

            async for chunk in response.aiter_bytes():

                image_data.extend(chunk)

                if len(image_data) > MAX_GARMENT_DOWNLOAD_SIZE:
                    raise ValueError(
                        "Garment image exceeds 20 MB limit."
                    )

    if not image_data:
        raise ValueError(
            "Garment image download returned no data."
        )

    with Image.open(BytesIO(image_data)) as source:

        if source.format not in ALLOWED_FORMATS:
            raise ValueError(
                "Unsupported garment image format."
            )

        if (
            source.width * source.height
            > MAX_GARMENT_PIXELS
        ):
            raise ValueError(
                "Garment image dimensions are too large."
            )

        image = ImageOps.exif_transpose(source)
        image = image.convert("RGB")

        image.thumbnail(
            (
                GARMENT_MAX_DIMENSION,
                GARMENT_MAX_DIMENSION,
            ),
            Image.Resampling.LANCZOS,
        )

        image.save(
            destination,
            format="JPEG",
            quality=88,
            optimize=True,
        )

    logger.info(
        "TRYONIX GARMENT READY | "
        "Size=%s bytes | Dimensions=%sx%s",
        destination.stat().st_size,
        image.width,
        image.height,
    )


# ==========================================
# UPLOAD PERSON IMAGE
# ==========================================

@router.post("/upload")
async def upload_person_image(
    file: UploadFile = File(...),
):

    try:

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Only JPG, PNG and WEBP images are allowed.",
            )

        contents = await file.read(
            MAX_FILE_SIZE + 1
        )

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Image must be smaller than 5 MB.",
            )

        with Image.open(BytesIO(contents)) as image:
            image.verify()

        with Image.open(BytesIO(contents)) as image:
            image_format = image.format
            width, height = image.size

        if image_format not in ALLOWED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail="Unsupported image format.",
            )

        if width < 256 or height < 256:
            raise HTTPException(
                status_code=400,
                detail="Image must be at least 256x256 pixels.",
            )

        if width * height > MAX_GARMENT_PIXELS:
            raise HTTPException(
                status_code=400,
                detail="Image dimensions are too large.",
            )

        filename = (
            f"{uuid4().hex}"
            f"{ALLOWED_FORMATS[image_format]}"
        )

        (UPLOAD_DIR / filename).write_bytes(contents)

        return {
            "success": True,
            "message": "Image uploaded successfully.",
            "image_id": filename,
            "width": width,
            "height": height,
        }

    except HTTPException:
        raise

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
    ) as exc:

        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image.",
        ) from exc

    finally:
        await file.close()


# ==========================================
# PREPARE VIRTUAL TRY-ON
# ==========================================

@router.post("/prepare")
def prepare_tryon(
    request: TryOnPrepareRequest,
    db: Session = Depends(get_db),
):

    get_uploaded_person_path(request.image_id)

    product = get_active_product(
        db,
        request.product_id,
    )

    clothing_type = detect_clothing_type(product)

    logger.warning(
        "TRYONIX PREPARE | "
        "Product ID=%s | Clothing type=%s",
        product.id,
        clothing_type,
    )

    return {
        "success": True,
        "message": (
            "Virtual try-on request "
            "prepared successfully."
        ),
        "status": "ready_for_inference",
        "tryon_request": {
            "image_id": request.image_id,
            "product_id": product.id,
            "product_name": product.name,
            "product_image_url": product.image_url,
            "category": product.category,
            "clothing_type": clothing_type,
        },
    }


# ==========================================
# GENERATE AI VIRTUAL TRY-ON
# ==========================================

@router.post("/generate")
async def generate_tryon(
    request: TryOnPrepareRequest,
    db: Session = Depends(get_db),
):

    # STEP 1: Validate person image
    person_image_path = get_uploaded_person_path(
        request.image_id
    )

    # STEP 2: Fetch selected product
    product = get_active_product(
        db,
        request.product_id,
    )

    # STEP 3: Detect clothing category
    clothing_type = detect_clothing_type(product)

    logger.warning(
        "TRYONIX GENERATE | "
        "Product ID=%s | "
        "Name=%s | "
        "Category=%s | "
        "Sending clothing_type=%s",
        product.id,
        product.name,
        product.category,
        clothing_type,
    )

    # STEP 4: Check GPU configuration
    if not tryon_engine.api_url:
        raise HTTPException(
            status_code=503,
            detail=(
                "AI inference service "
                "is not configured yet."
            ),
        )

    # STEP 5: Temporary garment path
    garment_path = (
        UPLOAD_DIR / f"garment_{uuid4().hex}.jpg"
    )

    try:


        # ==========================================
        # STEP 6: PREPARE PRODUCT GARMENT IMAGE
        # ==========================================

        try:
            if product.image_url.startswith("/products/"):

                # Product image stored locally
                prepare_local_garment(
                    image_url=product.image_url,
                    destination=garment_path,
                )

            else:

                # Product image hosted on external URL
                await download_and_prepare_garment(
                    image_url=product.image_url,
                    destination=garment_path,
                )

        except (
            httpx.HTTPError,
            OSError,
            ValueError,
            UnidentifiedImageError,
            Image.DecompressionBombError,
        ) as exc:

            logger.warning(
                "Garment processing failed: %s",
                exc,
            )

            raise HTTPException(
                status_code=400,
                detail="Unable to process selected garment image.",
            ) from exc


        # STEP 7: Send to CatVTON GPU
        try:

            logger.warning(
                "TRYONIX GPU REQUEST | "
                "clothing_type=%s",
                clothing_type,
            )

            generated_image = (
                await tryon_engine.generate_tryon(
                    person_image_path=str(
                        person_image_path
                    ),
                    garment_image_path=str(
                        garment_path
                    ),
                    clothing_type=clothing_type,
                )
            )

        except (
            httpx.HTTPError,
            RuntimeError,
            OSError,
        ) as exc:

            logger.exception(
                "TRYONIX AI inference failed"
            )

            raise HTTPException(
                status_code=502,
                detail=(
                    "AI virtual try-on "
                    "generation failed."
                ),
            ) from exc

        # STEP 8: Return generated image
        logger.warning(
            "TRYONIX GENERATION SUCCESS | "
            "Clothing type=%s",
            clothing_type,
        )

        return Response(
            content=generated_image,
            media_type="image/png",
        )

    finally:
        garment_path.unlink(
            missing_ok=True
        )
