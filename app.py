import streamlit as st
import time
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.llms import Ollama

st.title("Smart Stickies Product Page - Ollama Simple Search Demo")

def load_and_split(file_path):
    loader = TextLoader(file_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return splitter.split_documents(docs)

def create_chroma_index(docs):
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return Chroma.from_documents(docs, embeddings)

if "index" not in st.session_state:
    nike_docs = load_and_split("nike.txt")  # Make sure these files exist in your folder
    mac_docs = load_and_split("macbook.txt")
    all_docs = nike_docs + mac_docs
    st.session_state.index = create_chroma_index(all_docs)
    st.session_state.llm = Ollama(model="llama3")
    st.session_state.qa_chain = RetrievalQA.from_chain_type(
        llm=st.session_state.llm,
        chain_type="stuff",
        retriever=st.session_state.index.as_retriever(),
        return_source_documents=True,
    )

query = st.text_input("Ask about a product:", key="product_query")

if query:
    start = time.time()
    tokens_before = len(query.split()) * 4
    response = st.session_state.qa_chain({"query": query})
    answer = response["result"]
    tokens_after = (len(query.split()) + len(answer.split())) * 4
    elapsed = time.time() - start

    st.write("**Answer:**")
    st.write(answer)
    st.write(f"*Query processing took {elapsed:.2f} seconds*")

    st.markdown("---")
    st.write(f"**Token Usage Estimate:**")
    st.write(f"Without RAG (simple query): ~{tokens_before} tokens")
    st.write(f"With RAG (query + retrieved answer): ~{tokens_after} tokens")
    st.write(f"*No API key needed, using local Ollama LLM*")

    # Show image only for mac or macbook air queries
    if query.lower() in ["macbook air", "mac"]:
        st.image("mac.webp", width=300)
