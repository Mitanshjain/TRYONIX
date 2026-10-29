# TRYONIX — Complete Project Handbook

**AI-Powered Fashion E-Commerce, Virtual Try-On, and AI Shopping Assistant**

**Last documented:** October 29, 2026
**Purpose:** This is a practical guide to understanding, running, debugging, explaining, and extending TRYONIX.

> **Important:** The CatVTON virtual try-on workflow has been confirmed working through actual HTTP 200 responses. The chatbot code demonstrates Groq, RAG, MCP tools, and conversation memory. Some website, voice, account, and deployment details have not been independently verified from a complete repository snapshot. This guide clearly separates confirmed facts from instructions and future plans.

---

## Table of Contents

1. What TRYONIX is and why we built it
2. The entire project in one minute
3. Technology stack and why each tool is used
4. Complete system architecture
5. Main project modules
6. Project folders and important files
7. How frontend, backend, and MySQL communicate
8. Products, users, and local API routes
9. Complete virtual try-on process
10. CatVTON explained from the beginning
11. Kaggle Tesla T4 GPU setup
12. GPU API, authentication, and Cloudflare tunnel
13. Running TRYONIX on Windows
14. AI shopping chatbot: Groq, prompts, and memory
15. RAG: teaching the chatbot about TRYONIX
16. MCP: giving the chatbot live product tools
17. RAG vs. MCP vs. LLM
18. Voice chatbot and latency
19. Every major problem we encountered and its fix
20. Debugging commands and checklist
21. Security, privacy, and production limitations
22. Testing checklist
23. Confirmed features vs. features to verify
24. Improvements to make next
25. How to restart everything after a long break
26. Interview and viva questions
27. Git and GitHub commands
28. Glossary and references

---

## 1. What TRYONIX Is and Why We Built It

TRYONIX is a fashion shopping website with artificial intelligence features.

A normal clothing website shows pictures of clothes on models. It can be difficult for customers to imagine how those clothes will look on their own bodies. TRYONIX aims to make this easier.

A customer can:

1. Open the shopping website.
2. Browse products such as T-shirts and jackets.
3. Select a product.
4. Upload their own photograph.
5. Ask the AI to show the selected garment on their photograph.
6. View the generated virtual try-on result.
7. Ask an AI shopping assistant about products, prices, sizes, and the shopping process.

**Example:** A customer selects a sky-blue quilted winter jacket. TRYONIX sends the customer's photo and the jacket image to CatVTON. The AI produces an image that shows the customer wearing a version of that jacket.

**Important limitation:** This is a generated visual preview, not an exact guarantee of real-world fit, size, fabric behavior, or appearance.

---

## 2. The Entire Project in One Minute

TRYONIX has two main AI features:

**Feature A — Virtual Try-On:** The customer uploads a photo, selects clothing, and receives an AI-generated picture.

**Feature B — Shopping Assistant:** The customer asks questions in natural language. The chatbot uses a language model for conversation, RAG for platform information, and MCP tools for live product information.

The website runs in the browser. A FastAPI backend handles requests and business logic. MySQL stores application data. The heavy image-generation model runs remotely on a Kaggle GPU.

Simple flow:

```text
Customer
   |
   v
Next.js Website
   |
   v
FastAPI Backend (Windows)
   |                     \
   v                      v
MySQL Database        AI Features
                        /      \
                       /        \
               Shopping Chatbot   Virtual Try-On
               Groq + RAG + MCP   CatVTON on Kaggle GPU
```

---

## 3. Technology Stack and Why Each Tool Is Used

| Technology | What it does | Simple explanation |
|---|---|---|
| Next.js | Frontend | Builds the pages customers see |
| React | User interface | Makes pages interactive |
| JavaScript / TypeScript | Frontend code | Controls browser behavior |
| Python | Backend and AI | Main programming language for the server |
| FastAPI | Backend framework | Creates API endpoints |
| Uvicorn | ASGI server | Runs the FastAPI application |
| MySQL | Database | Stores structured application information |
| HTTPX | HTTP client | Sends requests from the local backend to the GPU API |
| Groq API | Language model access | Generates chatbot responses |
| `openai/gpt-oss-20b` | Chatbot model in shared code | Interprets customer questions and selects tools |
| RAG | Knowledge retrieval | Supplies relevant platform information to the chatbot |
| MCP | Tool integration | Lets the chatbot request live product data |
| CatVTON | Virtual try-on model | Generates a person wearing a selected garment |
| PyTorch | Deep learning | Runs the model |
| CUDA | GPU computing | Allows PyTorch to use NVIDIA GPU hardware |
| Kaggle Notebooks | Remote execution | Hosts the GPU-based model |
| NVIDIA Tesla T4 | GPU hardware | Accelerates image generation |
| Hugging Face | Model hosting | Provides CatVTON checkpoints |
| Pillow | Image processing | Loads, resizes, and saves images |
| DensePose | Body understanding | Helps identify body regions |
| SCHP | Human parsing | Helps identify clothes and body areas |
| Cloudflare Quick Tunnel | Networking | Gives a temporary public HTTPS URL to the Kaggle API |
| `.env` | Configuration | Holds settings and private keys |
| Git / GitHub | Version control | Saves and shares code changes |

**Two different AI models are involved:** The Groq language model answers text questions. CatVTON generates try-on images. They do not do the same job.

---

## 4. Complete System Architecture

### A. Virtual try-on architecture

```text
User selects a jacket and uploads a photo
                    |
                    v
          Next.js Frontend
                    |
                    | POST /tryon/upload
                    | POST /tryon/prepare
                    | POST /tryon/generate
                    v
          Local FastAPI Backend
                    |
                    | Check product and garment category
                    | Read local image files
                    v
 backend/tryon/inference/engine.py
                    |
                    | HTTPS POST /generate
                    | x-api-key header
                    | person_image file
                    | garment_image file
                    | clothing_type field
                    v
          Cloudflare Quick Tunnel
                    |
                    v
        Kaggle FastAPI GPU Server
                    |
                    v
             CatVTON Pipeline
             + AutoMasker
             + DensePose / SCHP
                    |
                    v
             Generated PNG
                    |
                    v
          Local FastAPI Backend
                    |
                    v
          Result shown in website
```

### B. Chatbot architecture

```text
Customer asks a question
            |
            v
      Chatbot Backend
            |
            +--> RAG Retriever --> Platform knowledge
            |
            +--> Conversation history --> Previous context
            |
            v
      Groq Language Model
            |
            +--> If live product data is needed:
            |       MCP product tools
            |             |
            |             v
            |       Product database/API
            |
            v
      Final chatbot response
            |
            v
      Text shown to customer
      (and optionally spoken by voice interface)
```

---

## 5. Main Project Modules

### Frontend

The frontend is the visible part of TRYONIX. It displays clothing, accepts customer input, shows product details, and presents the try-on result.

### Backend

The backend receives requests, checks inputs, looks up product data, prepares images, calls the GPU API, and returns results.

### Database

MySQL is used for structured application data. Product information is clearly involved in the verified workflow. Exact account, cart, order, and payment table structures should be checked against the current database schema before documenting them as completed features.

### Virtual try-on inference

The inference engine connects the local backend to the Kaggle GPU service. The GPU performs the expensive AI calculation and returns the generated image.

### Shopping assistant

The assistant combines a language model, retrieved knowledge, live product tools, and conversation context.

---

## 6. Project Folders and Important Files

Known important paths:

```text
TRYONIX/
├── backend/
│   ├── main.py
│   ├── database/
│   ├── assistant/
│   │   ├── rag/
│   │   │   └── retriever.py
│   │   └── mcp/
│   │       └── mcp_client.py
│   └── tryon/
│       ├── routes.py
│       └── inference/
│           ├── config.py
│           └── engine.py
├── frontend/                 # Confirm actual frontend folder name
├── .env                      # Private; never commit
├── .gitignore
└── README.md
```

The chatbot source files shared during development show imports from `backend.assistant.rag.retriever` and `backend.assistant.mcp.mcp_client`. Their complete current directory tree should be confirmed in the repository.

Kaggle working directories:

```text
/kaggle/working/
├── CatVTON/
│   └── tryon_api.py
├── CatVTON_weights/
│   ├── mix-48k-1024/
│   ├── DensePose/
│   └── SCHP/
├── cloudflared
├── cloudflare.log
└── tryonix_api.log
```

### What the important files do

- `backend/main.py`: Creates the local FastAPI application.
- `backend/tryon/routes.py`: Handles upload, preparation, and generation requests.
- `backend/tryon/inference/config.py`: Reads the inference URL and other settings.
- `backend/tryon/inference/engine.py`: Sends images to Kaggle and checks the response.
- `backend/assistant/rag/retriever.py`: Finds relevant platform knowledge.
- `backend/assistant/mcp/mcp_client.py`: Calls available product tools.
- `tryon_api.py`: Defines the GPU API and calls CatVTON.
- `.env`: Stores configuration and secrets.

---

## 7. How Frontend, Backend, and MySQL Communicate

Imagine a customer opening the product page.

1. Next.js sends a request to the backend.
2. FastAPI receives the request.
3. FastAPI retrieves product information from the application data layer.
4. The backend returns JSON.
5. Next.js displays the products.

A verified example endpoint is:

```http
GET /products
```

The backend logs showed:

```text
GET /products HTTP/1.1" 200 OK
```

### What is JSON?

JSON is a common format for sending structured information between programs.

Example:

```json
{
  "id": 34,
  "name": "Sky Blue Quilted Winter Jacket",
  "category": "Jacket"
}
```

This is an example representation, not a verified complete database record.

### What is CORS?

CORS is a browser security rule. It controls whether a website on one origin, such as `localhost:3000`, can call an API on another origin, such as `localhost:8000`.

The logs included successful `OPTIONS` requests before POST requests. These are normal browser preflight requests.

### Why the project-root `.env` matters

The working project uses:

```text
D:\Data Science\Projects\TRYONIX\.env
```

The inference configuration loads that file explicitly. Placing the same settings in a different directory may not work.

---

## 8. Products, Users, and Local API Routes

### Confirmed local routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/products` | Retrieve products |
| POST | `/tryon/upload` | Upload a customer photo |
| POST | `/tryon/prepare` | Prepare the selected garment |
| POST | `/tryon/generate` | Run virtual try-on |

### Confirmed product examples

- Product ID 34: Sky Blue Quilted Winter Jacket, category Jacket.
- Product ID 4: Minimalist White Oversized Tee, category T-Shirts.

Both were detected as `upper` clothing.

### Garment category detection

The backend decides which body region the model should change.

- `upper`: Shirts, T-shirts, jackets, and other upper-body garments.
- `lower`: Pants and other lower-body garments.
- `overall`: Full-body outfits.

The API accepts these category names. This does **not** mean all categories have been thoroughly tested for visual quality.

### Accounts, carts, orders, and payments

These are common e-commerce modules, but their exact implementation and database schema were not available in the verified code excerpts. Check the current routes and tables before describing them as complete.

---

## 9. Complete Virtual Try-On Process

### Step 1: Select clothing

The customer chooses a product from the website.

### Step 2: Upload a person image

The browser sends the image to:

```http
POST /tryon/upload
```

### Step 3: Prepare the garment

The backend identifies the product category and prepares the garment image:

```http
POST /tryon/prepare
```

Example log:

```text
TRYONIX CATEGORY DETECTION |
Product=sky blue quilted winter jacket |
Category=jacket |
Result=upper
```

### Step 4: Generate

The browser calls:

```http
POST /tryon/generate
```

The local backend then calls the **different** Kaggle endpoint:

```http
POST /generate
```

These two endpoints are not interchangeable. One belongs to the local backend; the other belongs to the remote GPU server.

### Step 5: Send the correct form fields

The Kaggle API expects:

| Field | Meaning |
|---|---|
| `person_image` | Customer photograph |
| `garment_image` | Clothing photograph |
| `clothing_type` | `upper`, `lower`, or `overall` |

A simplified HTTPX request:

```python
response = await client.post(
    f"{self.api_url}/generate",
    headers={"x-api-key": self.api_key},
    files={
        "person_image": (person_path.name, person_file, person_mime),
        "garment_image": (garment_path.name, garment_file, garment_mime),
    },
    data={"clothing_type": clothing_type},
)

response.raise_for_status()
```

### Step 6: Generate the image

CatVTON runs on the Kaggle GPU. The backend expects a PNG response.

### Step 7: Return the result

The backend returns the generated result to the frontend.

### Confirmed success

```text
TRYONIX GPU REQUEST | clothing_type=upper
TRYONIX GENERATION SUCCESS | Clothing type=upper
POST /tryon/generate HTTP/1.1" 200 OK
```

This is the important milestone: the complete request reached the GPU service and succeeded.

---

## 10. CatVTON Explained from the Beginning

### What is CatVTON?

CatVTON is a deep learning model for virtual clothing try-on.

It receives a person image and a clothing image, then generates a new image showing the clothing on the person.

### What is a mask?

A mask tells the model which part of the picture may be changed.

Think of editing a photo with a paintbrush: the mask is the area where editing is allowed. For an upper-body shirt, the model should mainly modify the clothing area while preserving the rest of the picture.

### What is AutoMasker?

AutoMasker automatically prepares the mask. It uses information from body and clothing parsing components.

### What is DensePose?

DensePose helps a computer understand which visible pixels correspond to parts of the human body.

### What is SCHP?

SCHP is a human parsing approach. It helps identify regions such as clothing and body parts.

### What is diffusion?

A diffusion model learns to generate images through a sequence of denoising steps.

In virtual try-on, it uses the person, garment, and mask information to generate the clothing appearance.

### What is inpainting?

Inpainting means generating or replacing a selected area of an image while using the surrounding image as context.

### Previously used model configuration

The working setup used CatVTON checkpoints from `zhengchong/CatVTON` and an inpainting base model. The previously discussed pipeline used approximately:

```text
Input processing size: 768 × 1024
Inference steps: 30
Guidance scale: 2.5
GPU dtype: float16
```

These are recorded development settings, not universal recommended values. Check the current `tryon_api.py` before changing them.

### Why some generated clothes look imperfect

AI image generation may produce:

- Incorrect jacket length or waist hem.
- Distorted pockets.
- Hands blending into clothing.
- Blurred facial details.
- Changed background details.
- Clothing textures that do not exactly match the original garment.

These are image-quality problems, not necessarily API problems.

**Next quality task:** Inspect the person image, garment image, generated image, and debug mask together before adjusting CatVTON settings.

---

## 11. Kaggle Tesla T4 GPU Setup

### Why we used a GPU

Image-generation models require many mathematical calculations. GPUs can perform these calculations much faster than typical CPUs.

We used a remote Kaggle NVIDIA Tesla T4 because the local Windows machine does not need to run CatVTON directly.

### Step 1: Enable GPU

In Kaggle Notebook settings, select an available GPU accelerator.

### Step 2: Check GPU

```python
!nvidia-smi
```

```python
import torch

print("PyTorch:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
```

The working environment reported a Tesla T4 GPU.

### Step 3: Clone CatVTON

```python
!git clone https://github.com/Zheng-Chong/CatVTON.git /kaggle/working/CatVTON
```

If the directory already exists, do not clone over it blindly.

### Step 4: Download checkpoints

```python
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="zhengchong/CatVTON",
    local_dir="/kaggle/working/CatVTON_weights",
)
```

The downloaded checkpoints included CatVTON attention weights and body-parsing components.

### Step 5: Prepare the API

The working GPU API file is:

```text
/kaggle/working/CatVTON/tryon_api.py
```

The project previously restored this file from a Kaggle dataset backup.

### Step 6: Check checkpoint path

The API must use the Kaggle path, not the old Google Colab path.

Correct:

```python
CHECKPOINTS = "/kaggle/working/CatVTON_weights"
```

Incorrect in Kaggle:

```python
CHECKPOINTS = "/content/CatVTON/checkpoints"
```

### Step 7: Install compatible dependencies

The Kaggle environment needed additional dependencies such as `fvcore` and `av`.

```python
!pip install -q fastapi uvicorn python-multipart httpx pillow huggingface_hub fvcore av
```

This is **not** the complete pinned dependency list for every CatVTON version. Install the remaining model dependencies according to the working environment, and avoid overwriting a functioning PyTorch/CUDA setup with incompatible old pins.

### Important compatibility lesson

During development, older CatVTON dependency expectations did not perfectly match the newer Kaggle Python/PyTorch environment. Some imports failed until compatible packages were installed.

If a package import fails, inspect the exact error and version before changing many dependencies at once.

---

## 12. GPU API, Authentication, and Cloudflare Tunnel

### Why another FastAPI server exists

The local FastAPI backend manages the website. The Kaggle FastAPI server manages GPU image generation.

Kaggle endpoints confirmed from OpenAPI:

```text
GET  /health
POST /generate
```

### What is an API key?

An API key is a private value used to decide whether a request is allowed.

The GPU API reads an `x-api-key` header. The server checks it against its configured key.

### Windows `.env`

The project-root `.env` should contain:

```dotenv
AI_INFERENCE_URL=https://YOUR-CURRENT-TUNNEL.trycloudflare.com
AI_INFERENCE_API_KEY=YOUR_PRIVATE_KEY
```

Do not put real secrets in the README or Git repository.

### Configure the Kaggle key

In a Kaggle notebook, enter the same key privately:

```python
import os
from getpass import getpass

api_key = getpass("Enter TRYONIX GPU API key: ").strip()

os.environ["API_KEY"] = api_key
os.environ["AI_INFERENCE_API_KEY"] = api_key

print("Configured:", bool(api_key))
print("Length:", len(api_key))
```

The GPU API must actually read the variable being set. Inspect the `API_KEY = ...` assignment in `tryon_api.py` if necessary.

**Important:** Restart the GPU API after changing its environment variables. An already-running process may still use the old key.

### Start the Kaggle GPU API

```python
import os
import sys
import time
import subprocess
import requests
from pathlib import Path

PROJECT = Path("/kaggle/working/CatVTON")
LOG_PATH = Path("/kaggle/working/tryonix_api.log")

subprocess.run(["fuser", "-k", "8000/tcp"], capture_output=True)
time.sleep(2)

with LOG_PATH.open("w") as log:
    process = subprocess.Popen(
        [
            sys.executable, "-m", "uvicorn", "tryon_api:app",
            "--host", "0.0.0.0", "--port", "8000",
        ],
        cwd=str(PROJECT),
        env=os.environ.copy(),
        stdout=log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )

print("GPU API PID:", process.pid)

for attempt in range(60):
    try:
        response = requests.get(
            "http://127.0.0.1:8000/health", timeout=5
        )
        if response.status_code == 200:
            print("GPU API READY:", response.json())
            break
    except requests.RequestException:
        pass
    time.sleep(3)
else:
    print(LOG_PATH.read_text()[-3000:])
```

Confirmed response format:

```json
{"status":"ready","gpu":true,"model":"CatVTON"}
```

### What is Cloudflare Quick Tunnel?

The GPU server normally listens on `127.0.0.1:8000` inside Kaggle. Your Windows computer cannot directly reach that private Kaggle address.

Cloudflare Quick Tunnel creates a temporary public HTTPS address that forwards requests to the Kaggle server.

### Download Cloudflared

```python
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /kaggle/working/cloudflared
!chmod +x /kaggle/working/cloudflared
```

### Start the tunnel

```python
import subprocess

with open("/kaggle/working/cloudflare.log", "w") as log:
    tunnel = subprocess.Popen(
        [
            "/kaggle/working/cloudflared",
            "tunnel",
            "--url", "http://127.0.0.1:8000",
            "--no-autoupdate",
        ],
        stdout=log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )

print("Tunnel PID:", tunnel.pid)
```

### Find the public URL

```python
import re
import time
from pathlib import Path

log_file = Path("/kaggle/working/cloudflare.log")

for _ in range(30):
    content = log_file.read_text(errors="replace")
    match = re.search(
        r"https://[a-zA-Z0-9-]+\.trycloudflare\.com",
        content,
    )
    if match:
        print("Tunnel URL:", match.group(0))
        break
    time.sleep(2)
else:
    print("No tunnel URL found. Check cloudflare.log.")
```

Copy the **current** URL into the Windows `.env` file. The earlier working tunnel URL may stop working when the session changes.

### Check the public health endpoint

```python
import requests

url = "https://YOUR-CURRENT-TUNNEL.trycloudflare.com"

response = requests.get(url + "/health", timeout=20)
print(response.status_code, response.text)
```

**Security warning:** A public tunnel exposes the GPU API to the internet. Keep the generation endpoint authenticated, do not log private images or secrets, and do not use Quick Tunnel as permanent production infrastructure.

---

## 13. Running TRYONIX on Windows

### Project location

The working Windows path was:

```text
D:\Data Science\Projects\TRYONIX
```

### Start the backend

Open a terminal in the project root:

```powershell
cd "D:\Data Science\Projects\TRYONIX"
python -m uvicorn backend.main:app --reload --port 8000
```

Expected:

```text
Uvicorn running on http://127.0.0.1:8000
Application startup complete.
```

### Why this exact command matters

`backend.main:app` means:

- Find the `backend` Python package.
- Open `main.py`.
- Run the FastAPI variable named `app`.

Running `uvicorn main:app` from the project root caused an import problem because that module path was incorrect.

### Start the frontend

Open another terminal in the actual Next.js application directory:

```powershell
npm install
npm run dev
```

Typical development URL:

```text
http://localhost:3000
```

### Useful URLs

```text
Frontend:       http://localhost:3000
Local backend:  http://127.0.0.1:8000
Swagger docs:   http://127.0.0.1:8000/docs
OpenAPI schema: http://127.0.0.1:8000/openapi.json
```

### Verify inference configuration without revealing secrets

```powershell
python -c "from backend.tryon.inference.engine import tryon_engine; print('GPU URL:', tryon_engine.api_url); print('Key configured:', bool(tryon_engine.api_key)); print('Key length:', len(tryon_engine.api_key))"
```

### Check GPU health from Windows

```powershell
python -c "import requests; from backend.tryon.inference.engine import tryon_engine; r=requests.get(tryon_engine.api_url+'/health',timeout=20); print(r.status_code,r.text)"
```

### Useful Windows commands

```powershell
dir                 # List files
cd folder_name      # Change directory
cd ..               # Go up one directory
python --version    # Python version
pip --version       # pip version
git status          # Git working tree
```

`ls` may not work in the Windows Command Prompt. Use `dir`.

---

## 14. AI Shopping Chatbot: Groq, Prompts, and Memory

### What the chatbot does

The chatbot is designed to help customers:

- Find clothing products.
- Ask about prices.
- Ask about available sizes and stock.
- Get outfit suggestions.
- Understand how virtual try-on works.
- Ask questions in English or Hinglish.

### What is an LLM?

An LLM is a large language model. It reads language and generates a response.

### What is Groq?

Groq provides API access to language models. It is used for the chatbot, not for the CatVTON image-generation process.

### Model used in shared chatbot code

```python
MODEL = "openai/gpt-oss-20b"
```

The shared code configured a Groq client with an API key and timeouts. Confirm the model name in the current repository before assuming it is unchanged.

### What is a system prompt?

A system prompt is a set of instructions that tells the assistant how to behave.

The TRYONIX prompt instructs the assistant to:

1. Help customers find real products.
2. Use MCP for live product information.
3. Use RAG for platform instructions.
4. Avoid inventing prices, stock, sizes, or products.
5. Keep answers short and natural for voice use.
6. Never claim to have completed unsupported actions such as placing an order.

### What is conversation memory?

Conversation memory means including previous messages or relevant previous product context so the assistant can understand follow-up questions.

Example:

```text
Customer: Show me a white T-shirt.
Assistant: Here are the available white T-shirts.
Customer: Does the first one come in medium?
```

The assistant must understand what "the first one" refers to. It should then check live availability instead of assuming that old stock information is still correct.

The shared chatbot code included conversation history and previous product context. The exact persistence mechanism should be checked in the current application.

---

## 15. RAG: Teaching the Chatbot About TRYONIX

### What does RAG mean?

RAG stands for **Retrieval-Augmented Generation**.

It means: **find relevant information first, then use that information to help the language model answer**.

### Simple example

Customer asks:

> How do I use virtual try-on?

The system searches its TRYONIX knowledge base, finds the instructions about uploading a photo and choosing a product, and gives those instructions to the language model.

### Why use RAG?

Without RAG, the chatbot might guess how TRYONIX works.

With RAG, it can answer using project-specific information.

### RAG workflow

```text
Customer question
       |
       v
Search the knowledge base
       |
       v
Find the most relevant text
       |
       v
Add text to the LLM prompt
       |
       v
Generate an answer
```

### Confirmed retrieval code pattern

The shared chatbot source used:

```python
from functools import lru_cache
from backend.assistant.rag.retriever import RAGRetriever

@lru_cache(maxsize=1)
def get_retriever():
    return RAGRetriever()

documents = get_retriever().retrieve(
    query=message,
    top_k=3,
)

context = "\n\n".join(
    document["content"] for document in documents
)
```

### What does `top_k=3` mean?

It asks the retriever for the three most relevant results.

### Why cache the retriever?

Loading a retriever repeatedly can waste time. `lru_cache(maxsize=1)` allows the process to reuse one initialized retriever.

### Does RAG always require a vector database?

No. RAG requires retrieval, but the retrieval method can vary. The exact indexing, embeddings, and storage implementation should be confirmed from `retriever.py`.

### When should RAG be used?

Use RAG for relatively stable information, such as:

- How the website works.
- How to upload a photo.
- Virtual try-on instructions.
- Return policy documents, if present in the knowledge base.
- Platform FAQs.

Do not treat old retrieved stock or price information as live data.

---

## 16. MCP: Giving the Chatbot Live Product Tools

### What is MCP?

MCP stands for **Model Context Protocol**.

In simple terms, it is a standard way for an AI application to connect with external tools and information.

For TRYONIX, the chatbot code uses an MCP client to call product-related tools.

### Confirmed tool names in the shared chatbot code

| Tool | What it does |
|---|---|
| `search_products` | Searches products by keyword, category, or budget |
| `get_product_details` | Retrieves information for a product ID |
| `check_product_availability` | Checks available stock and listed sizes |

### Example 1: Search products

Customer:

> Show me T-shirts under ₹1,000.

Possible tool arguments:

```json
{
  "query": "t-shirt",
  "max_price": 1000,
  "limit": 5
}
```

These are example arguments, not a claim that particular products were returned.

### Example 2: Product details

```json
{
  "product_id": 4
}
```

### Example 3: Availability

```json
{
  "product_id": 34
}
```

### Tool calling process

```text
Customer: Is jacket 34 available?
             |
             v
LLM recognizes a live-data question
             |
             v
Selects check_product_availability
             |
             v
MCP client calls the product tool
             |
             v
Tool returns current product information
             |
             v
LLM explains the result to the customer
```

### Why MCP matters

The language model should not invent current product details. MCP lets it request actual information from application tools.

### Important distinction

The tool names and `call_mcp_tool` integration are evidenced in shared chatbot code. To verify the complete running MCP server, inspect its actual transport, tool implementations, startup process, and logs.

---

## 17. RAG vs. MCP vs. LLM

These three technologies work together, but each has a different job.

| Technology | Main question it answers | Example |
|---|---|---|
| LLM | How should I understand and answer this question? | Explain an outfit recommendation |
| RAG | What does the TRYONIX knowledge base say? | How do I use virtual try-on? |
| MCP | What is the current information in the connected system? | Is product 34 available? |

### Example: One conversation using all three

Customer:

> I want a jacket under ₹2,000. Can I try it on?

1. **LLM:** Understands that the customer wants a jacket, has a budget, and wants try-on.
2. **MCP:** Searches the current catalog for jackets under ₹2,000.
3. **RAG:** Retrieves instructions about how virtual try-on works.
4. **LLM:** Combines the verified product results and platform instructions into a helpful answer.

This is the reason we did not build the chatbot using only a language model.

---

## 18. Voice Chatbot and Latency

### What is a voice chatbot?

A voice chatbot allows a customer to speak instead of typing. Depending on the actual implementation, it may use speech recognition, text generation, and speech synthesis.

The project discussions included voice chatbot latency. The exact speech-to-text and text-to-speech providers were not verified in the shared code excerpts, so this README does not invent them.

### What is latency?

Latency is the time between a customer action and the system response.

For a chatbot:

```text
Customer asks question
       |
       v
Speech-to-text (if using voice)
       |
       v
RAG retrieval
       |
       v
LLM tool selection
       |
       v
MCP call (if needed)
       |
       v
LLM response
       |
       v
Text-to-speech (if using voice)
       |
       v
Customer hears answer
```

Each stage may add delay.

### Latency monitoring in shared code

The chatbot code used `time.perf_counter()` to measure stages such as RAG retrieval and Groq tool selection.

Example:

```python
import time

start = time.perf_counter()

# Run a component here.

elapsed = time.perf_counter() - start
print(f"Component latency: {elapsed:.2f}s")
```

### Performance improvements discussed

- Reuse the RAG retriever rather than reinitializing it.
- Keep retrieved context focused (`top_k=3` was used).
- Avoid unnecessary tool calls.
- Keep voice responses concise.
- Use appropriate model timeouts.
- Measure individual components instead of guessing where the delay happens.

### What to measure next

- Total time to first response.
- RAG retrieval time.
- MCP tool execution time.
- Groq response time.
- Speech recognition time.
- Speech generation time.
- CatVTON generation time separately.

---

## 19. Every Major Problem We Encountered and Its Fix

This section is especially important when restarting the project.

### Problem 1: Backend import error

**Symptom:** `ModuleNotFoundError` when running the wrong Uvicorn command.

**Cause:** The Python module path did not match the project layout.

**Fix:**

```powershell
cd "D:\Data Science\Projects\TRYONIX"
python -m uvicorn backend.main:app --reload --port 8000
```

### Problem 2: HTTP 503 — GPU service not configured

**Symptom:** The website said the AI service was not connected.

**Cause:** The inference URL was not loaded correctly from `.env`.

**Fix:** Load the project-root `.env` explicitly in the inference configuration.

```python
from pathlib import Path
from dotenv import load_dotenv
import os

PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env", override=True)

AI_INFERENCE_URL = os.getenv(
    "AI_INFERENCE_URL", ""
).strip().rstrip("/")
```

### Problem 3: HTTP 404 — Wrong GPU endpoint

**Symptom:**

```text
GPU inference failed with HTTP 404
```

**Cause:** The local backend called `/tryon`, but Kaggle registered `/generate`.

**Fix:**

```python
f"{self.api_url}/generate"
```

### Problem 4: HTTP 422 — Wrong multipart field names

**Symptom:**

```text
GPU inference failed with HTTP 422
```

**Cause:** The backend sent:

```text
person
cloth
category
```

Kaggle expected:

```text
person_image
garment_image
clothing_type
```

**Fix:** Change the HTTPX multipart request to the expected names.

### Problem 5: HTTP 401 — Unauthorized

**Symptom:**

```text
CatVTON GPU HTTP 401 | Response: {"detail":"Unauthorized"}
```

**Cause:** The GPU API required an API key, but the configured server key was missing or did not match the header value.

**Fix:**

1. Confirm the Windows backend loads its key.
2. Configure the same key in Kaggle.
3. Ensure the local request sends `x-api-key`.
4. Restart Kaggle Uvicorn so it receives the updated environment.
5. Test again.

The working Windows key length was 43 characters. The key itself must remain private.

### Problem 6: HTTP 502 — Bad Gateway

**Symptom:** Local `/tryon/generate` returned 502.

**Meaning:** The local backend could not complete the GPU request successfully.

**Fix:** Read the **original upstream error** in the backend logs. The actual cause may be 401, 404, 422, timeout, or a GPU exception.

### Problem 7: Kaggle package import failures

**Symptom:** Missing packages such as `fvcore` or `av`.

**Cause:** The notebook environment lacked required packages or had compatibility differences.

**Fix:** Install compatible missing dependencies and retest imports.

### Problem 8: Wrong checkpoint path

**Symptom:** The GPU API could not find model weights.

**Cause:** The API still used a Colab-style `/content/...` path.

**Fix:** Use:

```text
/kaggle/working/CatVTON_weights
```

### Problem 9: Tunnel health works, but generation fails

**Symptom:** `/health` returns 200 but `/generate` fails.

**Explanation:** Health only proves that the API is reachable and reports ready. It does not prove that authentication, form fields, or the inference call are correct.

**Fix:** Inspect the exact response status and body from `/generate`.

### Problem 10: Tunnel URL changes

**Symptom:** The previously working URL stops responding after a session restart.

**Cause:** Cloudflare Quick Tunnel URLs are temporary.

**Fix:** Start or inspect the current tunnel, copy the new URL, update `.env`, and restart the local backend if required.

### Problem 11: Jacket and hand artifacts

**Symptom:** Distorted jacket hem, pockets, hands, or blurred details.

**Cause:** Image-generation quality limitations, possibly involving masks, garment alignment, resolution, or inference settings.

**Fix:** Inspect the mask and source images before changing parameters. Do not confuse image-quality problems with HTTP connectivity problems.

---

## 20. Debugging Commands and Checklist

### A. Is the local backend running?

Open:

```text
http://127.0.0.1:8000/docs
```

### B. Is the product API working?

```powershell
python -c "import requests; r=requests.get('http://127.0.0.1:8000/products'); print(r.status_code,r.text[:300])"
```

### C. Is the GPU service reachable?

```powershell
python -c "import requests; from backend.tryon.inference.engine import tryon_engine; r=requests.get(tryon_engine.api_url+'/health',timeout=20); print(r.status_code,r.text)"
```

### D. What endpoints does Kaggle actually have?

Run in Kaggle:

```python
import requests

schema = requests.get(
    "http://127.0.0.1:8000/openapi.json"
).json()

for path, methods in schema["paths"].items():
    print(path, list(methods))
```

### E. Read Kaggle GPU logs

```python
from pathlib import Path

print(
    Path("/kaggle/working/tryonix_api.log")
    .read_text(errors="replace")[-5000:]
)
```

### F. Read Cloudflare logs

```python
from pathlib import Path

print(
    Path("/kaggle/working/cloudflare.log")
    .read_text(errors="replace")[-5000:]
)
```

### G. Check GPU usage

```python
!nvidia-smi
```

### H. Check local key configuration

```powershell
python -c "from backend.tryon.inference.engine import tryon_engine; print(bool(tryon_engine.api_key), len(tryon_engine.api_key))"
```

### I. Recommended troubleshooting order

1. Read the exact error and status code.
2. Check whether the local backend is running.
3. Check the public GPU `/health`.
4. Check the Kaggle `/openapi.json`.
5. Check the endpoint path.
6. Check multipart field names.
7. Check authentication without exposing the key.
8. Read Kaggle logs.
9. Check CUDA and model loading.
10. Only then change inference parameters.

**Rule:** Fix one problem at a time. Avoid rewriting the entire working system to fix one small error.

---

## 21. Security, Privacy, and Production Limitations

### Protect secrets

Never commit:

- `.env` files.
- API keys.
- Database passwords.
- Groq credentials.
- Private customer images.

Example `.gitignore` entries:

```gitignore
.env
.env.*
!.env.example
.venv/
__pycache__/
*.pyc
node_modules/
.next/
*.log
uploads/
generated/
```

Adjust the image directories to match the actual repository.

### Protect customer photographs

Customer photos may contain personal information. A production application should define how images are stored, who can access them, how long they are retained, and how users can delete them.

### Protect the GPU API

Use authentication, request limits, file size limits, MIME validation, and appropriate monitoring.

### Kaggle and Cloudflare limitations

Kaggle notebooks are useful for development but may stop, restart, or run out of GPU allocation.

Cloudflare Quick Tunnel provides a temporary URL, not a permanent production service.

### Do not claim unsupported features

The chatbot should not claim to have placed orders, changed stock, or completed payments unless the corresponding authenticated actions really exist.

---

## 22. Testing Checklist

### Local application

- [ ] Next.js frontend starts.
- [ ] FastAPI backend starts.
- [ ] `/products` returns data.
- [ ] Frontend can call backend.
- [ ] MySQL connection works.

### Virtual try-on

- [ ] Kaggle GPU is available.
- [ ] CatVTON model loads.
- [ ] GPU `/health` returns 200.
- [ ] Cloudflare tunnel is reachable.
- [ ] Windows backend loads current URL.
- [ ] Windows and Kaggle use matching API keys.
- [ ] `/tryon/upload` returns 200.
- [ ] `/tryon/prepare` returns 200.
- [ ] `/tryon/generate` returns 200.
- [ ] The generated image appears in the browser.
- [ ] Jacket and T-shirt outputs are visually inspected.

### Shopping assistant

- [ ] Groq API key loads.
- [ ] Chatbot responds to a basic question.
- [ ] RAG retrieves relevant platform information.
- [ ] MCP product search returns real products.
- [ ] Product details tool works.
- [ ] Availability tool works.
- [ ] Follow-up questions use conversation context.
- [ ] Voice input and output work, if enabled.
- [ ] Latency is measured.

The chatbot checks above are a verification plan, not a claim that every test has already passed.

---

## 23. Confirmed Features vs. Features to Verify

### Confirmed through actual backend and GPU logs

- Local FastAPI server started.
- Product API returned 200.
- Image upload returned 200.
- Try-on preparation returned 200.
- Jacket and T-shirt categories were detected as `upper`.
- Kaggle GPU health returned ready.
- Cloudflare tunnel health returned 200.
- Authentication and request-field errors were resolved.
- End-to-end virtual try-on generation returned HTTP 200.

### Evidenced in shared chatbot source code

- Groq client configuration.
- LLM model selection.
- RAG retriever integration.
- `top_k=3` retrieval.
- MCP product tools.
- Conversation history and previous product context.
- Latency measurement.
- Rules against inventing store-specific information.

### Not completely verified from the available source snapshot

- Every frontend page and interaction.
- Exact database table definitions.
- Complete account, cart, order, and payment flows.
- Current MCP server runtime and transport.
- Current voice provider and audio pipeline.
- Complete deployment configuration.
- Quality of every clothing category.

These items should be verified against the actual repository before being marked complete.

---

## 24. Improvements to Make Next

### Virtual try-on quality

- Improve jacket waist and bottom hem alignment.
- Reduce hand and pocket distortion.
- Preserve faces and hairstyles more accurately.
- Improve texture and image sharpness.
- Compare masks with generated results.
- Test multiple poses and body types.
- Evaluate lower-body and full-body garments.

### Chatbot

- Measure total response time.
- Improve follow-up question handling.
- Reduce unnecessary retrieval and tool calls.
- Validate live product details.
- Improve voice response speed.
- Add more test cases.

### Infrastructure

- Replace temporary tunnel hosting for production.
- Add a persistent GPU service.
- Use a secret manager.
- Add monitoring and structured logs.
- Add request queues and concurrency controls.
- Define image retention and deletion policies.

---

## 25. How to Restart Everything After a Long Break

This is the most useful section when returning to TRYONIX months later.

### Phase 1 — Start the local backend

1. Open VS Code.
2. Open `D:\Data Science\Projects\TRYONIX`.
3. Check the project-root `.env`.
4. Start:

```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

### Phase 2 — Start the frontend

Open another terminal in the Next.js application directory:

```powershell
npm run dev
```

### Phase 3 — Start Kaggle

1. Open the Kaggle notebook.
2. Enable GPU.
3. Confirm CUDA with `!nvidia-smi`.
4. Check that CatVTON code and checkpoints exist.
5. Install any missing compatible dependencies.
6. Configure the GPU API key.
7. Start the GPU FastAPI server.
8. Wait until `/health` returns ready.

### Phase 4 — Start Cloudflare

1. Start `cloudflared` if it is not already running.
2. Read the current tunnel URL.
3. Test the public `/health`.
4. Update `AI_INFERENCE_URL` in Windows `.env`.
5. Restart the local backend if its configuration changed.

### Phase 5 — Test virtual try-on

1. Open the website.
2. Choose a known working T-shirt or jacket.
3. Upload a suitable person image.
4. Generate the result.
5. Confirm HTTP 200 and inspect the image.

### Phase 6 — Test the assistant

1. Confirm `GROQ_API_KEY` is configured.
2. Check that the knowledge base is available.
3. Check MCP tool connectivity.
4. Ask a basic platform question.
5. Ask a live product question.
6. Ask a follow-up question.
7. Test voice features separately if configured.

### Phase 7 — Before changing code

- Make a Git commit.
- Keep a backup of the working GPU API.
- Record current package versions.
- Save logs for any failure.
- Change one component at a time.

---

## 26. Interview and Viva Questions

**Q1. What is TRYONIX?**
TRYONIX is an AI-powered fashion e-commerce project with a virtual try-on feature and an AI shopping assistant.

**Q2. Why did you use Next.js?**
To build the interactive customer-facing website.

**Q3. Why FastAPI?**
To create Python-based APIs for products, image uploads, inference, and AI integrations.

**Q4. Why MySQL?**
To store structured application data such as products.

**Q5. Why use CatVTON?**
It is a model designed for image-based virtual clothing try-on.

**Q6. Why use Kaggle?**
To access an NVIDIA GPU for computationally expensive image generation.

**Q7. What is a GPU?**
A processor designed for many parallel calculations, which makes it useful for deep learning.

**Q8. What is CUDA?**
NVIDIA's computing platform that lets compatible software run calculations on NVIDIA GPUs.

**Q9. What is Cloudflare Quick Tunnel?**
A temporary HTTPS connection that makes the Kaggle-hosted API reachable from the local backend.

**Q10. What is RAG?**
A method that retrieves relevant information and adds it to an LLM's context before answering.

**Q11. What is MCP?**
A standard way for AI applications to connect to external tools and information sources.

**Q12. Why not use only an LLM?**
An LLM may not know current product stock or exact project instructions. RAG supplies platform knowledge and MCP tools provide live information.

**Q13. What is a system prompt?**
Instructions that guide the chatbot's behavior and limitations.

**Q14. What is conversation memory?**
Using previous messages or context to understand follow-up questions.

**Q15. What caused HTTP 404?**
The local backend used `/tryon`, while the GPU API expected `/generate`.

**Q16. What caused HTTP 422?**
The multipart field names did not match the GPU API schema.

**Q17. What caused HTTP 401?**
The GPU API rejected a missing or mismatched API key.

**Q18. What does HTTP 502 mean here?**
The local backend failed to complete the upstream GPU inference request.

**Q19. What is latency?**
The delay between a request and its result.

**Q20. What would you improve for production?**
Persistent GPU hosting, security, monitoring, queues, image privacy, and better image quality.

---

## 27. Git and GitHub Commands

### Check repository status

```bash
git status
```

### Add changes

```bash
git add README.md
```

### Commit changes

```bash
git commit -m "Add complete TRYONIX project handbook"
```

### Push to GitHub

```bash
git push
```

If the repository is not yet connected to GitHub, initialize and configure the remote according to the actual repository URL.

### Important Git habits

- Never commit real API keys.
- Do not upload customer photographs without permission.
- Keep large model weights out of normal Git history.
- Use meaningful commit messages.
- Update this README whenever the architecture or commands change.

---

## 28. Glossary and References

### Glossary

| Term | Simple meaning |
|---|---|
| API | A way for two programs to communicate |
| Endpoint | A specific API URL and action |
| Frontend | The part of the website customers see |
| Backend | The server that handles requests |
| Database | Organized storage for information |
| JSON | A common format for exchanging data |
| HTTP | A protocol used for web communication |
| HTTP 200 | Request succeeded |
| HTTP 401 | Request was not authorized |
| HTTP 404 | Requested endpoint was not found |
| HTTP 422 | Request data did not match expected rules |
| HTTP 502 | Gateway/backend could not complete an upstream request |
| HTTP 503 | Service unavailable or not configured |
| LLM | Large language model |
| RAG | Retrieval-Augmented Generation |
| MCP | Model Context Protocol |
| GPU | Graphics processing unit |
| CUDA | NVIDIA GPU computing platform |
| Checkpoint | Saved model weights |
| Inference | Using a trained model to produce a result |
| Mask | Image region selected for editing |
| Diffusion | A family of image-generation methods |
| Latency | Time taken to respond |
| Token | A unit of text processed by a language model |
| Tunnel | A network connection that exposes a local service |
| Environment variable | A configuration value supplied to a program |

### Official references

- CatVTON: https://github.com/Zheng-Chong/CatVTON
- CatVTON checkpoints: https://huggingface.co/zhengchong/CatVTON
- FastAPI: https://fastapi.tiangolo.com/
- PyTorch: https://pytorch.org/
- Kaggle: https://www.kaggle.com/
- Next.js: https://nextjs.org/
- Groq: https://console.groq.com/docs
- Model Context Protocol: https://modelcontextprotocol.io/
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

---

## Final Summary

TRYONIX brings together a fashion shopping website, a Python backend, a product database, an AI shopping assistant, and a GPU-powered virtual try-on model.

The key idea is to use the right technology for each task:

- **Next.js** for the website.
- **FastAPI** for server-side logic.
- **MySQL** for structured product data.
- **Groq LLM** for natural conversation.
- **RAG** for platform knowledge.
- **MCP** for live product tools.
- **CatVTON** for virtual try-on images.
- **Kaggle Tesla T4** for GPU computation.
- **Cloudflare Tunnel** for temporary remote access.

The end-to-end CatVTON integration has been demonstrated successfully. The next engineering priorities are image-quality improvements, chatbot and voice performance verification, and more reliable deployment infrastructure.

**Keep this document updated as the project grows.**
