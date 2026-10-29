"""TRYONIX: Create six local jacket illustrations and set their URLs in MySQL.
Run from project root: uv run python fix_tryonix_6_jackets_offline.py
These are catalog placeholders, NOT photographs or suitable CatVTON inputs.
"""
from pathlib import Path
from backend.database import SessionLocal
from backend.models import Product

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / 'frontend' / 'public' / 'products' / 'jackets'

JACKETS = {
    30: ('Olive Classic Denim Jacket', '#68734e', '#515b3b', 'denim'),
    31: ('Beige Lightweight Bomber Jacket', '#cbb68e', '#aa946c', 'bomber'),
    32: ('Charcoal Utility Field Jacket', '#55565b', '#3d3e42', 'field'),
    33: ('Cream Varsity Street Jacket', '#e6dfc8', '#9e7966', 'varsity'),
    34: ('Sky Blue Quilted Winter Jacket', '#8dbbdb', '#6e9dbd', 'quilted'),
    35: ('Forest Green Canvas Workwear Jacket', '#405e48', '#304938', 'workwear'),
}


def svg(color, dark, kind):
    collar = ('<path d="M245 132 L300 198 L355 132 L330 114 L300 150 L270 114 Z" fill="'+dark+'"/>' if kind != 'bomber' else '<path d="M258 127 Q300 163 342 127" stroke="'+dark+'" stroke-width="21" fill="none"/>')
    details = ''
    if kind in ('denim','field','workwear'):
        details += f'<rect x="227" y="235" width="52" height="65" rx="4" fill="none" stroke="{dark}" stroke-width="5"/><rect x="321" y="235" width="52" height="65" rx="4" fill="none" stroke="{dark}" stroke-width="5"/>'
        details += f'<path d="M227 250h52M321 250h52" stroke="{dark}" stroke-width="5"/>'
    if kind == 'quilted':
        for y in (225,267,309,351,393,435):
            details += f'<path d="M210 {y} H390" stroke="{dark}" stroke-width="3" opacity=".5"/>'
    if kind == 'varsity':
        details += f'<path d="M214 210 L168 390 M386 210 L432 390" stroke="{dark}" stroke-width="13"/>'
        details += f'<path d="M235 465h130" stroke="{dark}" stroke-width="10"/>'
    if kind == 'bomber':
        details += f'<path d="M214 462 H386" stroke="{dark}" stroke-width="20"/>'
        details += f'<path d="M172 425l35 6 M393 431l35-6" stroke="{dark}" stroke-width="18"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="720" viewBox="0 0 600 720">
<rect width="600" height="720" fill="#f4f3f0"/>
<ellipse cx="300" cy="602" rx="164" ry="15" fill="#dddcd9"/>
<path d="M239 128 L190 150 L130 390 L181 411 L211 303 L214 475 Q300 498 386 475 L389 303 L419 411 L470 390 L410 150 L361 128 L330 113 L300 148 L270 113 Z" fill="{color}" stroke="{dark}" stroke-width="7" stroke-linejoin="round"/>
<path d="M300 149 L300 484" stroke="{dark}" stroke-width="5"/>
{collar}
<path d="M206 215 L181 411 M394 215 L419 411" stroke="{dark}" stroke-width="4" opacity=".5"/>
{details}
<circle cx="311" cy="242" r="4" fill="#e9e7df"/><circle cx="311" cy="284" r="4" fill="#e9e7df"/><circle cx="311" cy="326" r="4" fill="#e9e7df"/><circle cx="311" cy="368" r="4" fill="#e9e7df"/>
<text x="300" y="655" font-family="Arial,sans-serif" font-size="20" letter-spacing="5" text-anchor="middle" fill="#555">TRYONIX</text>
</svg>'''


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    db = SessionLocal()
    try:
        for pid, (name, color, dark, kind) in JACKETS.items():
            product = db.get(Product, pid)
            if product is None:
                print(f'SKIP #{pid}: not found')
                continue
            filename = f'jacket-{pid}.svg'
            (PUBLIC / filename).write_text(svg(color, dark, kind), encoding='utf-8')
            product.image_url = f'/products/jackets/{filename}'
            print(f'PREPARED #{pid}: {name} -> {product.image_url}')
        db.commit()
        print('\nSUCCESS: Local placeholder images saved and product URLs committed.')
        print('Restart frontend if needed, then refresh http://localhost:3000')
        print('NOTE: SVG illustrations are NOT suitable for virtual try-on. Replace with real product photos later.')
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == '__main__':
    main()
