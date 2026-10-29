
# ==========================================
# TRYONIX - LIGHTWEIGHT RAG RETRIEVER
# TF-IDF + COSINE SIMILARITY
# ==========================================

from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


KNOWLEDGE_PATH = (
    Path(__file__).resolve().parent
    / "knowledge"
    / "tryonix_knowledge.txt"
)


def load_knowledge():
    text = KNOWLEDGE_PATH.read_text(encoding="utf-8")

    chunks = [
        section.strip()
        for section in text.split("## ")
        if section.strip()
    ]

    return chunks


class RAGRetriever:

    def __init__(self):
        print("Loading lightweight TRYONIX RAG...")

        self.documents = load_knowledge()

        if not self.documents:
            raise ValueError("TRYONIX knowledge base is empty.")

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True
        )

        self.document_vectors = self.vectorizer.fit_transform(
            self.documents
        )

        print(
            f"TRYONIX RAG ready: "
            f"{len(self.documents)} knowledge chunks indexed."
        )

    def retrieve(self, query: str, top_k: int = 3):
        if not query.strip() or top_k <= 0:
            return []

        query_vector = self.vectorizer.transform([query])

        scores = cosine_similarity(
            query_vector,
            self.document_vectors
        )[0]

        ranked_indices = scores.argsort()[::-1][:top_k]

        results = []

        for index in ranked_indices:
            if scores[index] <= 0:
                continue

            results.append({
                "content": self.documents[index],
                "score": float(scores[index])
            })

        return results


if __name__ == "__main__":
    retriever = RAGRetriever()

    question = "How do I use virtual try-on?"

    results = retriever.retrieve(question)

    print(f"\nQUESTION: {question}")

    for result in results:
        print("\n--------------------------")
        print("Similarity:", round(result["score"], 3))
        print("Content:", result["content"])
