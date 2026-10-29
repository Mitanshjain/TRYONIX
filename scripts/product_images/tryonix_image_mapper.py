
import csv
import html
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# ==========================================
# TRYONIX - PRODUCT IMAGE MAPPER
# ==========================================

BASE = Path(__file__).resolve().parent

INPUT = BASE / "tryonix.csv"
CANDIDATES = BASE / "tryonix_image_candidates.csv"
REVIEW = BASE / "tryonix_image_review.html"
SQL = BASE / "tryonix_approved_images.sql"
PROGRESS = BASE / "tryonix_search_progress.csv"

API = "https://api.openverse.org/v1/images/"

PAGE_SIZE = 3
REQUEST_TIMEOUT = (8, 12)
REQUEST_DELAY = 1.5

FIELDS = [
    "product_id",
    "product_name",
    "image_url",
    "thumbnail",
    "license",
    "license_url",
    "creator",
    "source_page",
    "approved_image_url",
]

PROGRESS_FIELDS = [
    "product_id",
    "product_name",
    "status",
]


# ==========================================
# STEP 1 - HTTP SESSION
# ==========================================

def create_session():
    session = requests.Session()

    retry = Retry(
        total=2,
        connect=2,
        read=1,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        respect_retry_after_header=True,
    )

    adapter = HTTPAdapter(
        max_retries=retry,
        pool_connections=5,
        pool_maxsize=5,
    )

    session.mount("https://", adapter)

    session.headers.update({
        "User-Agent": "TRYONIX-Portfolio/1.0",
        "Accept": "application/json",
    })

    return session


# ==========================================
# STEP 2 - CSV UTILITIES
# ==========================================

def read_csv(path):
    if not path.exists():
        return []

    with path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:
        return list(csv.DictReader(file))


def save_csv(path, rows, fields):
    with path.open(
        "w",
        encoding="utf-8-sig",
        newline="",
    ) as file:
        writer = csv.DictWriter(
            file,
            fieldnames=fields,
            extrasaction="ignore",
        )

        writer.writeheader()
        writer.writerows(rows)


# ==========================================
# STEP 3 - IMAGE SEARCH
# ==========================================

def search_images(session, query):
    try:
        response = session.get(
            API,
            params={
                "q": query,
                "page_size": PAGE_SIZE,
            },
            timeout=REQUEST_TIMEOUT,
        )

        response.raise_for_status()

        data = response.json()

        return data.get("results", []), True

    except requests.exceptions.Timeout:
        print("  [TIMEOUT] Openverse response too slow.")

    except requests.exceptions.ConnectionError as exc:
        print(f"  [CONNECTION ERROR] {exc}")

    except requests.exceptions.HTTPError as exc:
        print(f"  [HTTP ERROR] {exc}")

    except requests.exceptions.RequestException as exc:
        print(f"  [REQUEST ERROR] {exc}")

    except ValueError:
        print("  [ERROR] Invalid JSON response.")

    return [], False


# ==========================================
# STEP 4 - BUILD IMAGE CANDIDATES
# ==========================================

def build_candidate(product, item):
    return {
        "product_id": product["id"],
        "product_name": product["name"],
        "image_url": item.get("url") or "",
        "thumbnail": item.get("thumbnail") or "",
        "license": item.get("license") or "",
        "license_url": item.get("license_url") or "",
        "creator": item.get("creator") or "",
        "source_page": item.get("foreign_landing_url") or "",
        "approved_image_url": "",
    }


# ==========================================
# STEP 5 - HTML IMAGE REVIEW
# ==========================================

def generate_review(rows):
    cards = []

    for row in rows:
        product_name = html.escape(
            row["product_name"]
        )

        product_id = html.escape(
            str(row["product_id"])
        )

        image_url = html.escape(
            row["thumbnail"] or row["image_url"],
            quote=True,
        )

        original_url = html.escape(
            row["image_url"],
            quote=True,
        )

        creator = html.escape(
            row["creator"] or "Unknown"
        )

        license_name = html.escape(
            row["license"] or "Unknown"
        )

        source_page = html.escape(
            row["source_page"],
            quote=True,
        )

        cards.append(f"""
        <article>
            <img src="{image_url}" loading="lazy">

            <h3>{product_name}</h3>

            <p>Product ID: {product_id}</p>

            <p>Creator: {creator}</p>

            <p>License: {license_name}</p>

            <a href="{original_url}" target="_blank"
               rel="noopener noreferrer">
                Open Image
            </a>

            <a href="{source_page}" target="_blank"
               rel="noopener noreferrer">
                View Source
            </a>
        </article>
        """)

    page = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport"
              content="width=device-width, initial-scale=1.0">

        <title>TRYONIX Image Review</title>

        <style>
            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                padding: 30px;
                font-family: Arial, sans-serif;
                background: #101010;
                color: white;
            }

            h1 {
                text-align: center;
                margin-bottom: 10px;
            }

            .subtitle {
                text-align: center;
                color: #aaa;
                margin-bottom: 35px;
            }

            .grid {
                display: grid;
                grid-template-columns:
                    repeat(auto-fit, minmax(240px, 1fr));
                gap: 20px;
            }

            article {
                background: #1e1e1e;
                padding: 15px;
                border-radius: 12px;
                border: 1px solid #333;
            }

            img {
                width: 100%;
                height: 270px;
                object-fit: contain;
                background: white;
                border-radius: 8px;
            }

            h3 {
                font-size: 16px;
                margin-top: 15px;
            }

            p {
                color: #bbb;
                font-size: 13px;
            }

            a {
                display: inline-block;
                color: #9ac5ff;
                margin-right: 12px;
                margin-top: 8px;
                font-size: 13px;
            }
        </style>
    </head>

    <body>
        <h1>TRYONIX Product Image Review</h1>

        <p class="subtitle">
            Review clothing type, color, fit and license
            before approving images.
        </p>

        <div class="grid">
    """

    page += "\n".join(cards)
    page += "</div></body></html>"

    REVIEW.write_text(
        page,
        encoding="utf-8",
    )


# ==========================================
# STEP 6 - SEARCH ALL PRODUCTS
# ==========================================

def run_search():
    products = read_csv(INPUT)

    if not products:
        print("[ERROR] tryonix.csv is missing or empty.")
        return

    existing_candidates = read_csv(CANDIDATES)
    progress_rows = read_csv(PROGRESS)

    completed_ids = {
        row["product_id"]
        for row in progress_rows
        if row.get("status") == "completed"
    }

    # Preserve previous image approvals.
    candidates = existing_candidates.copy()

    session = create_session()

    total = len(products)

    print("\n================================")
    print("TRYONIX IMAGE SEARCH STARTED")
    print("================================")
    print(f"Total products: {total}")
    print(f"Already completed: {len(completed_ids)}")
    print("================================\n")

    try:
        for index, product in enumerate(products, start=1):
            product_id = str(product["id"]).strip()
            product_name = product["name"].strip()

            if product_id in completed_ids:
                print(
                    f"[{index}/{total}] SKIPPED: {product_name}"
                )
                continue

            query = f"{product_name} fashion clothing"

            print(
                f"\n[{index}/{total}] Searching: {query}"
            )

            results, success = search_images(
                session,
                query,
            )

            if success:
                # Remove old unapproved candidates for
                # this product, but preserve approvals.
                candidates = [
                    row for row in candidates
                    if row["product_id"] != product_id
                    or row.get("approved_image_url", "").strip()
                ]

                existing_urls = {
                    (
                        row["product_id"],
                        row["image_url"],
                    )
                    for row in candidates
                }

                for item in results:
                    candidate = build_candidate(
                        product,
                        item,
                    )

                    key = (
                        candidate["product_id"],
                        candidate["image_url"],
                    )

                    if (
                        candidate["image_url"]
                        and key not in existing_urls
                    ):
                        candidates.append(candidate)
                        existing_urls.add(key)

                status = "completed"

                print(
                    f"  [SUCCESS] Found {len(results)} images"
                )

            else:
                status = "failed"

                print(
                    "  [FAILED] Will retry on next run."
                )

            progress_rows = [
                row for row in progress_rows
                if row["product_id"] != product_id
            ]

            progress_rows.append({
                "product_id": product_id,
                "product_name": product_name,
                "status": status,
            })

            # Save after every product.
            save_csv(
                CANDIDATES,
                candidates,
                FIELDS,
            )

            save_csv(
                PROGRESS,
                progress_rows,
                PROGRESS_FIELDS,
            )

            generate_review(candidates)

            time.sleep(REQUEST_DELAY)

    except KeyboardInterrupt:
        print("\n[STOPPED] Progress saved.")

    finally:
        session.close()

    completed = sum(
        row.get("status") == "completed"
        for row in progress_rows
    )

    failed = sum(
        row.get("status") == "failed"
        for row in progress_rows
    )

    print("\n================================")
    print("TRYONIX SEARCH SUMMARY")
    print("================================")
    print(f"Completed: {completed}/{total}")
    print(f"Failed: {failed}")
    print(f"Candidates: {len(candidates)}")
    print(f"CSV: {CANDIDATES}")
    print(f"HTML: {REVIEW}")
    print("================================")


# ==========================================
# STEP 7 - VALIDATE IMAGE URL
# ==========================================

def valid_image_url(url):
    parsed = urlparse(url)

    return (
        parsed.scheme == "https"
        and bool(parsed.netloc)
        and len(url) <= 1000
    )


# ==========================================
# STEP 8 - GENERATE SQL
# ==========================================

def generate_sql():
    rows = read_csv(CANDIDATES)

    if not rows:
        print("[ERROR] No image candidates found.")
        return

    approved = {}

    for row in rows:
        product_id = row["product_id"].strip()

        image_url = row.get(
            "approved_image_url", ""
        ).strip()

        if not image_url:
            continue

        if not valid_image_url(image_url):
            print(
                f"[SKIPPED] Invalid URL for ID {product_id}"
            )
            continue

        # First approved image wins.
        if product_id not in approved:
            approved[product_id] = image_url

    statements = [
        "-- TRYONIX APPROVED PRODUCT IMAGES",
        "USE tryonix_db;",
        "",
        "START TRANSACTION;",
        "",
    ]

    for product_id, url in sorted(
        approved.items(),
        key=lambda item: int(item[0]),
    ):
        if not product_id.isdigit():
            continue

        escaped_url = (
            url.replace("\\", "\\\\")
               .replace("'", "''")
        )

        statements.append(
            "UPDATE products "
            f"SET image_url = '{escaped_url}' "
            f"WHERE id = {int(product_id)} "
            "AND image_url IS NULL;"
        )

    statements.extend([
        "",
        "COMMIT;",
        "",
        "-- VERIFY",
        "SELECT COUNT(*) AS total_products,",
        "SUM(image_url IS NOT NULL) AS with_images,",
        "SUM(image_url IS NULL) AS missing_images",
        "FROM products;",
    ])

    SQL.write_text(
        "\n".join(statements),
        encoding="utf-8",
    )

    print("\n================================")
    print("SQL GENERATED SUCCESSFULLY")
    print("================================")
    print(f"Approved products: {len(approved)}")
    print(f"SQL file: {SQL}")
    print("================================")


# ==========================================
# STEP 9 - MAIN
# ==========================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "Usage: python tryonix_image_mapper.py search|sql"
        )

    elif sys.argv[1] == "search":
        run_search()

    elif sys.argv[1] == "sql":
        generate_sql()

    else:
        print("Invalid command. Use search or sql.")
