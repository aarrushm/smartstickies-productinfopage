"""
Lightweight RAG helper for the Smart Stickies product-page generator.
• Run `python rag_pipeline.py --reindex` any time you add /docs/*.txt
"""

import argparse, pathlib, os, json
from typing import List
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate


# ----- Paths ----------------------------------------------------------

ROOT_DIR     = pathlib.Path(__file__).parent
DOCS_DIR     = ROOT_DIR / "docs"
INDEX_DIR    = ROOT_DIR / "vector_index"

# ----- Build or load the vector store ---------------------------------

def build_vector_store(docs_path: pathlib.Path = DOCS_DIR,
                       index_path: pathlib.Path = INDEX_DIR,
                       chunk_size: int = 800,
                       chunk_overlap: int = 120) -> FAISS:
    """Ingest every .txt file in docs_path and create / overwrite FAISS index."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size,
                                              chunk_overlap=chunk_overlap)
    all_splits = []
    for txt in docs_path.glob("*.txt"):
        docs = TextLoader(str(txt), encoding="utf-8").load()
        splits = splitter.split_documents(docs)
        all_splits.extend(splits)

    embeddings = OpenAIEmbeddings()
    vdb = FAISS.from_documents(all_splits, embeddings)
    vdb.save_local(str(index_path))
    print(f"Indexed {len(all_splits)} chunks → {index_path}")
    return vdb


def load_vector_store(index_path: pathlib.Path = INDEX_DIR) -> FAISS:
    """Load existing FAISS index (build if missing)."""
    if not index_path.exists():
        print("Vector index not found; building a fresh one...")
        return build_vector_store(index_path=index_path)
    return FAISS.load_local(str(index_path), OpenAIEmbeddings(), allow_dangerous_deserialization=True)


# ----- RAG wrapper -----------------------------------------------------

def generate_product_page(query: str,
                          vdb: FAISS,
                          model: str = "gpt-3o-mini",
                          k: int = 3,
                          system_prompt: str | None = None) -> str:
    """Retrieve top-k chunks and ask the LLM to write a product page."""
    sys_prompt = system_prompt or (
        "You are Smart Stickies’ technical copywriter. "
        "Using only the provided context, draft an engaging product information "
        "page (≤350 words) with an H1 title, short specs table, and a benefits paragraph. "
        "If context is insufficient, say 'Insufficient data.'"
    )

    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template="""
{system_prompt}

Context:
{context}

Question:
{question}

Answer:"""
    ).partial(system_prompt=sys_prompt)

    retriever = vdb.as_retriever(search_kwargs={"k": k})
    chain = RetrievalQA.from_chain_type(
        llm=ChatOpenAI(model=model, temperature=0.3),
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=False,
        chain_type_kwargs={"prompt": prompt},
    )
    return chain.run(query)


# ----- CLI entry: `python rag_pipeline.py --reindex` -------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reindex", action="store_true",
                        help="Rebuild vector index from /docs/*.txt")
    parser.add_argument("--query",  help="Quick test query, e.g. 'SKU-123 page'")
    args = parser.parse_args()

    if args.reindex:
        build_vector_store()
    vdb = load_vector_store()
    if args.query:
        print(generate_product_page(args.query, vdb))
