# ==========================================
# TRYONIX - ORDER MANAGEMENT API
# ==========================================

from decimal import Decimal
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from backend.database import SessionLocal
from backend.models import User, Product, Order, OrderItem
from backend.security import decode_access_token

router = APIRouter(prefix="/orders", tags=["Orders"])
bearer_scheme = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    try:
        user_id = decode_access_token(credentials.credentials)
        user = db.get(User, user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return user


class CheckoutItem(BaseModel):
    product_id: int = Field(gt=0)
    size: str = Field(min_length=1, max_length=50)
    quantity: int = Field(ge=1, le=100)


class CheckoutRequest(BaseModel):
    customer_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=20)
    address: str = Field(min_length=5, max_length=1000)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=4, max_length=12)
    items: list[CheckoutItem] = Field(min_length=1)


def serialize_order(db: Session, order: Order):
    items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .order_by(OrderItem.id)
        .all()
    )

    return {
        "id": order.id,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "payment_method": order.payment_method,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "address": order.address,
        "city": order.city,
        "state": order.state,
        "postal_code": order.postal_code,
        "created_at": order.created_at.isoformat(),
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product_name,
                "size": item.size,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "subtotal": float(item.subtotal),
            }
            for item in items
        ],
    }


@router.post("/checkout", status_code=status.HTTP_201_CREATED)
def checkout(
    data: CheckoutRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    try:
        # Aggregate duplicate product-size lines.
        quantities = defaultdict(int)

        for item in data.items:
            size = item.size.strip()
            if not size:
                raise HTTPException(422, "Invalid size")

            quantities[(item.product_id, size)] += item.quantity

        product_ids = sorted({
            product_id for product_id, _ in quantities
        })

        # Lock products to protect stock during concurrent checkouts.
        products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .order_by(Product.id)
            .with_for_update()
            .all()
        )

        product_map = {product.id: product for product in products}
        total_by_product = defaultdict(int)

        for (product_id, size), quantity in quantities.items():
            product = product_map.get(product_id)

            if not product or not product.is_active:
                raise HTTPException(
                    404, f"Product {product_id} unavailable"
                )

            available_sizes = [
                s.strip().lower()
                for s in (product.sizes or "").split(",")
                if s.strip()
            ]

            if available_sizes:
                if size.lower() not in available_sizes:
                    raise HTTPException(
                        400, f"Invalid size for {product.name}"
                    )
            elif size.lower() != "one size":
                raise HTTPException(
                    400, f"Invalid size for {product.name}"
                )

            total_by_product[product_id] += quantity

        for product_id, quantity in total_by_product.items():
            product = product_map[product_id]

            if product.stock < quantity:
                raise HTTPException(
                    409,
                    f"Insufficient stock for {product.name}. "
                    f"Available: {product.stock}",
                )

        total = Decimal("0.00")
        order_lines = []

        for (product_id, size), quantity in quantities.items():
            product = product_map[product_id]
            unit_price = Decimal(str(product.price))
            subtotal = unit_price * quantity
            total += subtotal

            order_lines.append({
                "product_id": product_id,
                "product_name": product.name,
                "size": size,
                "quantity": quantity,
                "unit_price": unit_price,
                "subtotal": subtotal,
            })

        order = Order(
            user_id=user.id,
            customer_name=data.customer_name.strip(),
            phone=data.phone.strip(),
            address=data.address.strip(),
            city=data.city.strip(),
            state=data.state.strip(),
            postal_code=data.postal_code.strip(),
            total_amount=total,
            payment_method="demo_cod",
            status="placed",
        )

        db.add(order)
        db.flush()

        for line in order_lines:
            db.add(OrderItem(order_id=order.id, **line))

        for product_id, quantity in total_by_product.items():
            product_map[product_id].stock -= quantity

        db.commit()
        db.refresh(order)

        return serialize_order(db, order)

    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to place order. Please try again.",
        )


@router.get("")
def get_my_orders(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .all()
    )

    return [serialize_order(db, order) for order in orders]