
# ==========================================
# TRYONIX - RAG RETRIEVER
# Sentence Transformers + FAISS
# ==========================================

from pathlib import Path

import faiss
from sentence_transformers import SentenceTransformer


# ==========================================
# CONFIGURATION
# ==========================================

KNOWLEDGE_PATH = (
    Path(__file__).resolve().parent
    / "knowledge"
    / "tryonix_knowledge.txt"
)

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


# ==========================================
# LOAD KNOWLEDGE BASE
# ==========================================

def load_knowledge():
    text = KNOWLEDGE_PATH.read_text(encoding="utf-8")

    # Each section becomes a searchable chunk.
    chunks = [
        section.strip()
        for section in text.split("## ")
        if section.strip()
    ]

    return chunks


# ==========================================
# CREATE RAG RETRIEVER
# ==========================================

class RAGRetriever:

    def __init__(self):

        print("Loading TRYONIX embedding model...")

        self.model = SentenceTransformer(EMBEDDING_MODEL)

        self.documents = load_knowledge()

        # Convert documents into normalized vectors.
        embeddings = self.model.encode(
            self.documents,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        # Create FAISS index for similarity search.
        dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatIP(dimension)

        self.index.add(embeddings.astype("float32"))

        print(
            f"TRYONIX RAG ready: "
            f"{len(self.documents)} knowledge chunks indexed."
        )

    def retrieve(self, query: str, top_k: int = 3):

        # Convert customer question into an embedding.
        query_embedding = self.model.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        # Search for most relevant chunks.
        scores, indices = self.index.search(
            query_embedding.astype("float32"),
            min(top_k, len(self.documents))
        )

        results = []

        for score, index in zip(scores[0], indices[0]):
            if index >= 0:
                results.append({
                    "content": self.documents[index],
                    "score": float(score)
                })

        return results


# ==========================================
# TEST RETRIEVER
# ==========================================

if __name__ == "__main__":

    retriever = RAGRetriever()

    question = "How do I use virtual try-on?"

    results = retriever.retrieve(question)

    print(f"\nQUESTION: {question}")

    for result in results:
        print("\n--------------------------")
        print("Similarity:", round(result["score"], 3))
        print("Content:", result["content"])
