"""TRYONIX: collect real hosted clothing images and generate REVIEW-ONLY SQL.
Run from any folder: uv run python tryonix_bulk_images.py
Requires requests. Copy tryonix.csv beside this script.
"""
import csv, html, io, re, time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent
INPUT = ROOT / 'tryonix.csv'
OUT = ROOT / 'tryonix_bulk_candidates.csv'
HTML = ROOT / 'tryonix_bulk_review.html'
SQL = ROOT / 'tryonix_bulk_approved.sql'
REPO = 'https://raw.githubusercontent.com/alexeygrigorev/clothing-dataset/master'
CATEGORY_WORDS = {
 'T-Shirt':['t-shirt','tshirt','t shirt','top'],
 'Shirt':['shirt'],
 'Hoodie':['hoodie','sweatshirt'],
 'Jacket':['jacket','coat'],
 'Jeans':['jeans','trousers','pants'],
 'Cargo Pants':['pants','trousers','jeans'],
 'Dress':['dress'],
 'Trousers':['trousers','pants','jeans'],
}
COLORS = ['black','white','navy','olive','beige','charcoal','cream','sky blue','forest green','grey','gray','brown','maroon']
FIELDS=['id','name','category','image_url','dataset_label','image_status','approved']

def load_csv(p):
 with p.open('r',encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))

def write_csv(p,rows):
 with p.open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=FIELDS);w.writeheader();w.writerows(rows)

def fetch_catalog():
 r=requests.get(REPO+'/images.csv',timeout=40);r.raise_for_status()
 return list(csv.DictReader(io.StringIO(r.content.decode('utf-8-sig'))))

def category_match(category,label):
 words=CATEGORY_WORDS.get(category, [category.lower()]); label=label.lower()
 return any(word in label for word in words)

def candidate_url(image_id):
 image_id=image_id.strip()
 if not re.fullmatch(r'[\w-]+',image_id):return None
 return f'{REPO}/images/{image_id}.jpg'

def check_url(session,url):
 try:
  r=session.get(url,timeout=(6,12),stream=True)
  typ=r.headers.get('content-type','').lower()
  ok=r.status_code==200 and typ.startswith('image/')
  r.close();return ok
 except requests.RequestException:return False

def search():
 if not INPUT.exists():raise SystemExit(f'Missing {INPUT}')
 products=load_csv(INPUT); images=fetch_catalog()
 images=[i for i in images if str(i.get('kids','')).lower() not in ('true','1','yes')]
 existing={r['id']:r for r in load_csv(OUT)} if OUT.exists() else {}
 used={r['image_url'] for r in existing.values() if r.get('image_url')}
 s=requests.Session(); s.headers['User-Agent']='TRYONIX-portfolio-image-mapper/1.0'
 for n,p in enumerate(products,1):
  pid=str(p['id']); category=p['category'].strip()
  if pid in existing:
   print(f'[{n}/{len(products)}] Kept ID {pid}');continue
  matches=[i for i in images if category_match(category,str(i.get('label','')))]
  found=None
  for item in matches:
   url=candidate_url(str(item.get('image','')))
   if not url or url in used:continue
   if check_url(s,url):found=(url,item.get('label',''));used.add(url);break
  row={'id':pid,'name':p['name'],'category':category,
       'image_url':found[0] if found else '',
       'dataset_label':found[1] if found else '',
       'image_status':'reachable; visual match UNVERIFIED' if found else 'NO MATCH',
       'approved':'NO'}
  existing[pid]=row
  write_csv(OUT,list(existing.values()))
  print(f'[{n}/{len(products)}] {p["name"]}: {row["image_status"]}')
 build_html(list(existing.values()))
 print(f'\nReview: {HTML}\nCandidates: {OUT}\nSet approved=YES for correct images, then run: python {Path(__file__).name} sql')

def build_html(rows):
 cards=[]
 for r in rows:
  name=html.escape(r['name']);cat=html.escape(r['category']);label=html.escape(r['dataset_label'])
  url=html.escape(r['image_url'],quote=True)
  img=f'<img src="{url}" loading="lazy">' if url else '<p>NO MATCH</p>'
  cards.append(f'<article>{img}<h3>#{r["id"]} {name}</h3><p>{cat} | dataset: {label}</p><p>CHECK COLOR, DESIGN, GARMENT TYPE</p><a href="{url}" target="_blank">Image URL</a></article>')
 HTML.write_text('<!doctype html><meta charset="utf-8"><title>TRYONIX image review</title><style>body{background:#111;color:white;font:15px Arial;padding:20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:15px}article{background:#222;padding:15px;border-radius:12px}img{width:100%;height:250px;object-fit:contain;background:white}a{color:lightblue}</style><h1>TRYONIX: verify before approving</h1><p>Dataset category is approximate. Never approve wrong color or type. Edit approved column in CSV to YES.</p><div class="grid">'+''.join(cards)+'</div>',encoding='utf-8')

def sql():
 if not OUT.exists():raise SystemExit('Run search first.')
 rows=load_csv(OUT); statements=['USE tryonix_db;','START TRANSACTION;']
 count=0
 for r in rows:
  if r['approved'].strip().upper()!='YES' or not r['image_url']:continue
  pid=int(r['id']);url=r['image_url']
  if not url.startswith(REPO+'/images/') or len(url)>1000:continue
  safe=url.replace("'","''")
  statements.append(f"UPDATE products SET image_url = '{safe}' WHERE id = {pid} AND image_url IS NULL;")
  count+=1
 statements+=['COMMIT;','SELECT COUNT(*) total, SUM(image_url IS NULL) missing FROM products;']
 SQL.write_text('\n'.join(statements)+'\n',encoding='utf-8')
 print(f'Generated {count} APPROVED updates: {SQL}')

if __name__=='__main__':
 import sys
 if len(sys.argv)<2 or sys.argv[1]=='search':search()
 elif sys.argv[1]=='sql':sql()
 else:raise SystemExit('Usage: python tryonix_bulk_images.py search|sql')
