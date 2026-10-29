
# ==========================================
# TRYONIX - DATABASE MODELS
# ==========================================

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Numeric,
    Text,
    ForeignKey,
)

from backend.database import Base


# ==========================================
# USER MODEL
# ==========================================

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(String(255), nullable=False)

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    # Admin permission
    is_admin = Column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False
    )


# ==========================================
# PRODUCT MODEL
# ==========================================

class Product(Base):

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False)

    description = Column(Text, nullable=True)

    category = Column(String(100), nullable=False)

    collection = Column(String(100), nullable=True)

    gender = Column(String(30), nullable=False)

    price = Column(Numeric(10, 2), nullable=False)

    stock = Column(Integer, default=0, nullable=False)

    sizes = Column(String(255), nullable=True)

    image_url = Column(String(1000), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)


    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False
    )


# ==========================================
# ORDER MODEL
# ==========================================

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    customer_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(12), nullable=False)

    total_amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(30), default="demo_cod", nullable=False)
    status = Column(String(30), default="placed", nullable=False)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )


# ==========================================
# ORDER ITEM MODEL
# ==========================================

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False,
        index=True,
    )

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    product_name = Column(String(200), nullable=False)
    size = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)