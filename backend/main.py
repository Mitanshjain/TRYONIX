
# ==========================================
# TRYONIX - FASTAPI BACKEND
# ==========================================

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.database import SessionLocal
from backend.models import User, Product

from backend.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    ProductCreate,
    ProductResponse,
)

from backend.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

from backend.tryon.routes import router as tryon_router

from backend.assistant.routes import router as assistant_router


from backend.database import Base, engine
import backend.models
from backend.orders.routes import router as orders_router

# ==========================================
# INITIALIZE FASTAPI
# ==========================================

app = FastAPI(
    title="TRYONIX API",
    description="AI-Powered Fashion E-Commerce & Virtual Try-On Platform",
    version="1.0.0"
)
app.include_router(tryon_router)

app.include_router(assistant_router)

app.include_router(orders_router)

# Creates missing tables; does not migrate existing tables.
Base.metadata.create_all(bind=engine)


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# ==========================================
# DATABASE SESSION DEPENDENCY
# ==========================================

def get_db():

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ==========================================
# ROOT ENDPOINT
# ==========================================

@app.get("/")
async def root():

    return {
        "application": "TRYONIX",
        "message": "Welcome to TRYONIX API",
        "status": "running"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
async def health_check():

    return {
        "status": "healthy",
        "service": "TRYONIX Backend"
    }


# ==========================================
# REGISTER USER
# ==========================================

@app.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == str(user_data.email).lower()
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    hashed_password = hash_password(user_data.password)

    new_user = User(
        full_name=user_data.full_name.strip(),
        email=str(user_data.email).lower(),
        hashed_password=hashed_password
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    return new_user


# ==========================================
# USER LOGIN API
# ==========================================

@app.post("/login")
def login_user(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == str(login_data.email).lower()
    ).first()

    if not user or not verify_password(
        login_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful"
    }


# ==========================================
# AUTHENTICATED USER PROFILE
# ==========================================

bearer_scheme = HTTPBearer()

# ==========================================
# ADMIN AUTHENTICATION DEPENDENCY
# ==========================================

def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    # Decode JWT token
    user_id = decode_access_token(credentials.credentials)

    # Fetch user from database
    user = db.get(User, user_id)

    # Verify account exists and is active
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive user"
        )

    # Verify admin privileges
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return user


@app.get("/me", response_model=UserResponse)
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    user_id = decode_access_token(credentials.credentials)

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user


# ==========================================
# GET ALL ACTIVE PRODUCTS
# ==========================================

@app.get(
    "/products",
    response_model=list[ProductResponse]
)
def get_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):

    # Validate pagination parameters
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=422,
            detail="Invalid pagination parameters"
        )

    # Fetch only active products
    products = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .order_by(Product.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return products


# ==========================================
# GET PRODUCT BY ID
# ==========================================

@app.get(
    "/products/{product_id}",
    response_model=ProductResponse
)
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.is_active.is_(True)
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return product


# ==========================================
# CREATE PRODUCT - ADMIN ONLY
# ==========================================

@app.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    product_data: ProductCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):

    # Convert validated Pydantic data to dictionary
    product_values = product_data.model_dump()

    # Create product instance
    new_product = Product(**product_values)

    # Add product to database
    db.add(new_product)

    try:
        # Save changes
        db.commit()

        # Fetch generated ID and database defaults
        db.refresh(new_product)

    except Exception:
        # Roll back failed transaction
        db.rollback()
        raise

    return new_product