# app_rearrange.py with LLM integration
import streamlit as st
import time
import os
import glob
import re
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate

def strip_markdown(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    return text

st.set_page_config(page_title="Smart Stickies Product Page", layout="wide")

st.sidebar.header("Customize Layout")
layout_order = st.sidebar.multiselect(
    "Choose and order the sections:",
    ["Title", "Description", "Specs", "Price", "Reviews", "Color"],
    default=["Title", "Description", "Specs", "Price", "Reviews", "Color"]
)
image_position = st.sidebar.radio("Image Position:", ["Top", "Left", "Right"])

@st.cache_resource
def load_index():
    nike_docs = load_and_split("nike.txt")
    mac_docs = load_and_split("macbook.txt")
    all_docs = nike_docs + mac_docs
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2", model_kwargs={'device': 'cpu'})
    index = Chroma.from_documents(all_docs, embeddings)
    llm = Ollama(model="llama3")
    system_prompt = """
You are a product info page generator for an e-commerce site.
Given the product document(s) below and the user's query, generate a structured product info card with these fields (leave blank if not available):
- Product Name (as title)
- Short Description (1-2 sentences)
- Key Features (as bullet points)
- Specs (if available)
- Price (if available)
- Reviews (if available)
- Brand Name
- Color (if available)
- Image suggestion or file name(s)
- Logo suggestion or file name(s)
Return results as plain text only (no Markdown or bold/italic), **do NOT use conversational language.**
Context: {context}
Question: {question}
"""
    prompt_template = PromptTemplate(template=system_prompt, input_variables=["context", "question"])
    chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=index.as_retriever(), return_source_documents=True, chain_type_kwargs={"prompt": prompt_template})
    return chain

def load_and_split(file_path):
    loader = TextLoader(file_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return splitter.split_documents(docs)

def find_similar_images(suggested_names=None, fallback_query=None, only_logo=False):
    files = []
    available_files = []
    for ext in ['jpg', 'jpeg', 'png', 'webp']:
        available_files += glob.glob(f"*.{ext}")
    for f in available_files:
        if only_logo and "logo" not in f.lower():
            continue
        if not only_logo and "logo" in f.lower():
            continue
        files.append(f)
    if suggested_names:
        hits = []
        for name in suggested_names:
            if not name:
                continue
            base = os.path.splitext(name)[0].replace("_", "").replace("-", "").lower()
            for f in files:
                comp = os.path.splitext(f)[0].replace("_", "").replace("-", "").lower()
                if base in comp or comp in base:
                    hits.append(f)
        if hits:
            return list(dict.fromkeys(hits))
    if fallback_query:
        query_base = fallback_query.replace(" ", "").replace("-", "").replace("_", "").lower()
        hits = []
        for f in files:
            comp = os.path.splitext(f)[0].replace("_", "").replace("-", "").lower()
            if query_base in comp or comp in query_base:
                hits.append(f)
        if hits:
            return list(dict.fromkeys(hits))
    return files

query = st.text_input("Search for a product (e.g. 'MacBook Air', 'Nike'):", key="product_query")

if query:
    response = load_index()({"query": query})
    answer = response["result"]

    def extract_field(field):
        match = re.search(fr'{field}[:\- ]*([\s\S]*?)(?=\n[A-Z][a-z]+:|\Z)', answer)
        return match.group(1).strip() if match else ""

    title = query.title()
    description = extract_field("Short Description")
    specs = extract_field("Specs")
    price = extract_field("Price")
    reviews = extract_field("Reviews")
    color = extract_field("Color")

    img_matches = re.findall(r'([a-z0-9_\-]+?\.(?:jpg|jpeg|png|webp))', answer, re.IGNORECASE)
    image_files = find_similar_images(img_matches, fallback_query=query)
    image_path = image_files[0] if image_files and os.path.exists(image_files[0]) else None

    if image_position == "Top" and image_path:
        st.image(image_path, use_container_width=True)
        container = st.container()
    elif image_position == "Left" and image_path:
        col1, col2 = st.columns([2, 3])
        with col1:
            st.image(image_path, use_container_width=True)
        container = col2
    elif image_position == "Right" and image_path:
        col1, col2 = st.columns([3, 2])
        container = col1
        with col2:
            st.image(image_path, use_container_width=True)
    else:
        container = st.container()

    with container:
        for section in layout_order:
            if section == "Title":
                st.markdown(f"### {title}")
            elif section == "Description":
                st.write(description)
            elif section == "Specs" and specs:
                st.subheader("Specs")
                st.code(specs)
            elif section == "Price" and price:
                st.subheader("Price")
                st.write(price)
            elif section == "Reviews" and reviews:
                st.subheader("Reviews")
                st.write(reviews)
            elif section == "Color" and color:
                st.subheader("Available Colors")
                st.write(color)
