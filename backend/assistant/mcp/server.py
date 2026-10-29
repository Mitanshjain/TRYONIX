# ==========================================
# TRYONIX - PRODUCT MCP SERVER
# ==========================================

import re
from mcp.server.fastmcp import FastMCP
from sqlalchemy import and_, or_

from backend.database import SessionLocal
from backend.models import Product

mcp = FastMCP("TRYONIX Product Server")

# Normalization is deliberately small and deterministic.
# No guessed catalog products or prices are introduced.
SYNONYMS = {
    "jackets": "jacket", "coat": "jacket", "coats": "jacket",
    "shirts": "shirt", "tees": "tee", "tshirts": "shirt",
    "tshirt": "shirt", "t-shirt": "shirt", "t-shirts": "shirt",
    "kala": "black", "kali": "black", "kaali": "black",
    "kaala": "black", "siyah": "black",
    "neela": "blue", "neeli": "blue", "safed": "white",
    "lal": "red", "laal": "red", "hara": "green", "hari": "green",
    "pant": "pants", "trouser": "pants", "trousers": "pants",
}
STOPWORDS = {
    "i", "me", "my", "want", "need", "show", "find", "give", "get",
    "please", "some", "a", "an", "the", "of", "in", "for", "to",
    "with", "color", "colour", "colored", "coloured", "under",
    "below", "less", "than", "rs", "inr", "rupees", "price",
    "mujhe", "merko", "mujhko", "chahiye", "chaiye", "dikhao",
    "dikha", "acha", "accha", "achha", "sa", "ki", "ka", "ke",
    "mai", "mein", "main", "wale", "wali", "wala",
}


def serialize_product(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "collection": product.collection,
        "gender": product.gender,
        "price": float(product.price),
        "stock": product.stock,
        "sizes": product.sizes,
        "image_url": product.image_url,
    }


def _terms(query: str) -> list[str]:
    raw = re.findall(r"[a-zA-Z]+(?:-[a-zA-Z]+)?", query.lower())
    result = []
    for token in raw:
        token = SYNONYMS.get(token, token)
        if token not in STOPWORDS and len(token) > 1 and token not in result:
            result.append(token)
    return result


def _search_expression(term: str):
    # A shirt query can also find T-shirts/tees; do not equate
    # other garment categories or invent products.
    alternatives = [term]
    if term == "shirt":
        alternatives.extend(["tee", "t-shirt"])
    fields = (Product.name, Product.description, Product.category, Product.collection)
    return or_(*(field.ilike(f"%{word}%") for word in alternatives for field in fields))


@mcp.tool()
def search_products(
    query: str = "",
    max_price: float | None = None,
    limit: int = 10,
) -> list[dict]:
    """Search active, in-stock products by keywords, with optional budget."""
    try:
        limit = max(1, min(int(limit), 20))
    except (ValueError, TypeError):
        limit = 10

    if max_price is not None:
        try:
            max_price = float(max_price)
        except (TypeError, ValueError):
            return []
        if max_price < 0:
            return []

    terms = _terms(query or "")
    with SessionLocal() as db:
        products_query = db.query(Product).filter(
            Product.is_active.is_(True),
            Product.stock > 0,
        )
        if terms:
            products_query = products_query.filter(
                and_(*(_search_expression(term) for term in terms))
            )
        if max_price is not None:
            products_query = products_query.filter(Product.price <= max_price)

        products = (
            products_query.order_by(Product.price.asc(), Product.id.asc())
            .limit(limit).all()
        )
        return [serialize_product(p) for p in products]


@mcp.tool()
def get_product_details(product_id: int) -> dict:
    """Get live TRYONIX product information by product ID."""
    with SessionLocal() as db:
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.is_active.is_(True),
        ).first()
        if product is None:
            return {"error": "Product not found"}
        return serialize_product(product)


@mcp.tool()
def check_product_availability(product_id: int) -> dict:
    """Check current stock and listed sizes for an active product."""
    with SessionLocal() as db:
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.is_active.is_(True),
        ).first()
        if product is None:
            return {"error": "Product not found"}
        return {
            "product_id": product.id,
            "name": product.name,
            "in_stock": product.stock > 0,
            "stock_quantity": product.stock,
            "sizes": product.sizes,
        }


if __name__ == "__main__":
    mcp.run()
