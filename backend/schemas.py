
# ==========================================
# TRYONIX - PYDANTIC SCHEMAS
# ==========================================

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ==========================================
# USER REGISTRATION SCHEMA
# ==========================================

class UserCreate(BaseModel):

    full_name: str = Field(min_length=2, max_length=100)

    email: EmailStr

    password: str = Field(min_length=8, max_length=128)


# ==========================================
# USER RESPONSE SCHEMA
# ==========================================

class UserResponse(BaseModel):

    id: int

    full_name: str

    email: EmailStr

    is_active: bool

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# USER LOGIN SCHEMA
# ==========================================

class UserLogin(BaseModel):

    email: EmailStr

    password: str


# ==========================================
# PRODUCT CREATE SCHEMA
# ==========================================

class ProductCreate(BaseModel):

    name: str = Field(min_length=2, max_length=200)

    description: str | None = None

    category: str = Field(min_length=2, max_length=100)

    collection: str | None = Field(default=None, max_length=100)

    gender: str = Field(min_length=2, max_length=30)

    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)

    stock: int = Field(default=0, ge=0)

    sizes: str | None = Field(default=None, max_length=255)

    image_url: str | None = Field(default=None, max_length=1000)


# ==========================================
# PRODUCT RESPONSE SCHEMA
# ==========================================

class ProductResponse(BaseModel):

    id: int

    name: str

    description: str | None

    category: str

    collection: str | None

    gender: str

    price: Decimal

    stock: int

    sizes: str | None

    image_url: str | None

    is_active: bool

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
