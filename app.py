import streamlit as st
import time
import os
import glob
import re
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate

def strip_markdown(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    return text

st.set_page_config(page_title="Smart Stickies Product Page", layout="wide")

# ---- Improved, Airier CSS ----
st.markdown("""
    <style>
    body, .stApp { background: #191a1c !important; }
    .product-card { background: #23242a; border-radius: 27px; box-shadow: 0 10px 38px 0 rgba(0,0,0,0.14); padding: 3rem 3.5rem 2.7rem 3.5rem; margin-top: 2.4rem; margin-bottom: 2.5rem; }
    .product-title-row { display:flex; align-items:center; gap:28px; margin-bottom:22px; }
    .brand-logo { max-width: 62px; height:56px; border-radius:14px; margin-bottom:0; margin-right:16px; }
    .product-title { font-size: 2.7rem; font-weight: 900; color: #fff; margin:0; letter-spacing: -1.6px; text-shadow: 0 2px 12px rgba(0,0,0,0.15);}
    .product-desc { color: #fff !important; font-size: 1.23rem; font-weight: 500; line-height: 1.82; margin-bottom: 1.1rem; }
    .field-label { font-size: 1.22rem; font-weight: 700; color: #a8d1ff !important; margin-bottom:0.1rem; margin-top:1.3rem;}
    .field-value { font-size: 1.22rem; font-weight: 600; color: #fff !important; margin-bottom:1.07rem; }
    .feature-list li { margin-bottom: 0.36rem; font-size: 1.17rem; color: #c2e6fa !important; font-weight: 700;}
    .buy-btn { background-color: #0071e3; color: white; border: none; border-radius: 13px; padding: 0.95rem 2.4rem; font-weight: 700; font-size: 1.22rem; margin-top: 1.8rem; cursor: pointer; transition: background 0.2s; box-shadow: 0 2px 16px 0 rgba(0,50,160,0.14);}
    .buy-btn:hover { background: #005bb5;}
    .token-box { background: #23242a; border-radius: 17px; padding: 1.23rem; margin-top: 2.8rem; font-size: 1.14rem; color: #fff !important; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.12);}
    .stTextInput>div>div>input { background: #23242a; color: #fafbfc; font-size: 1.17rem; border-radius: 10px; font-weight: 600;}
    .img-main { border-radius: 21px; margin-bottom: 18px; }
    hr { border: 0; border-top: 1.7px solid #2c3239; margin: 1.3rem 0 1.6rem 0;}
    </style>
""", unsafe_allow_html=True)

st.markdown(
    '<div style="font-size:2.6rem;font-weight:900;letter-spacing:-1.5px;margin-bottom:12px;">Smart Stickies Product Page</div>',
    unsafe_allow_html=True
)
st.write("Powered by Ollama + RAG | Demo")

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
            return list(dict.fromkeys(hits))  # remove duplicates
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

def load_and_split(file_path):
    loader = TextLoader(file_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return splitter.split_documents(docs)

def create_chroma_index(docs):
    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )
    return Chroma.from_documents(docs, embeddings)

if "index" not in st.session_state:
    nike_docs = load_and_split("nike.txt")
    mac_docs = load_and_split("macbook.txt")
    all_docs = nike_docs + mac_docs
    st.session_state.index = create_chroma_index(all_docs)
    st.session_state.llm = Ollama(model="llama3")
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
    prompt_template = PromptTemplate(
        template=system_prompt,
        input_variables=["context", "question"]
    )
    st.session_state.qa_chain = RetrievalQA.from_chain_type(
        llm=st.session_state.llm,
        chain_type="stuff",
        retriever=st.session_state.index.as_retriever(),
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt_template}
    )

query = st.text_input("Search for a product (e.g. 'MacBook Air', 'Nike'):", key="product_query")

if query:
    start = time.time()
    tokens_before = len(query.split()) * 4
    response = st.session_state.qa_chain({"query": query})
    answer = response["result"]
    tokens_after = (len(query.split()) + len(answer.split())) * 4
    elapsed = time.time() - start

    img_matches = re.findall(r'([a-z0-9_\-]+?\.(?:jpg|jpeg|png|webp))', answer, re.IGNORECASE)
    md_img_matches = re.findall(r'\!\[.*?\]\((.*?)\)', answer)
    img_matches += md_img_matches
    image_files = find_similar_images(img_matches, fallback_query=query, only_logo=False)

    logo_matches = re.findall(r'([a-z0-9_\-]*logo[a-z0-9_\-]*\.(?:png|jpg|jpeg|webp))', answer, re.IGNORECASE)
    md_logo_matches = re.findall(r'\!\[.*?logo.*?\]\((.*?)\)', answer, re.IGNORECASE)
    logo_matches += md_logo_matches
    logo_files = find_similar_images(logo_matches, fallback_query=query if not logo_matches else None, only_logo=True)

    color = ""
    color_match = re.search(r'(Color[s]?|Colour[s]?|Available Color[s]?|Colors Available)[:\- ]*([^\n*]+)', answer, re.IGNORECASE)
    if color_match:
        color = color_match.group(2).strip().strip(" *")
    if not color:
        for fname in ["nike.txt", "macbook.txt"]:
            with open(fname) as f:
                txt = f.read()
                cm = re.search(r'(Color[s]?|Colour[s]?|Available Color[s]?|Colors Available)[:\- ]*([^\n*]+)', txt, re.IGNORECASE)
                if cm and query.lower().split()[0] in txt.lower():
                    color = cm.group(2).strip().strip(" *")
                    break

    brand = ""
    if "mac" in query.lower() or "apple" in query.lower():
        brand = "Apple"
    elif "nike" in query.lower() or "pegasus" in query.lower():
        brand = "Nike"

    specs = ""
    specs_match = re.search(r'Specs[:\- ]*([\s\S]*?)(?:\n[A-Z][a-z]+:|\Z)', answer)
    if specs_match:
        specs = specs_match.group(1).strip()
    price = ""
    price_match = re.search(r'Price[:\- ]*([^\n]+)', answer)
    if price_match:
        price = price_match.group(1).strip()
    reviews = ""
    reviews_match = re.search(r'Reviews[:\- ]*([\s\S]*?)(?:\n[A-Z][a-z]+:|\Z)', answer)
    if reviews_match:
        reviews = reviews_match.group(1).strip()

    desc_lines = []
    for line in answer.splitlines():
        if not (
            line.strip().lower().startswith("image suggestion")
            or line.strip().lower().startswith("logo suggestion")
            or line.strip().lower().endswith(".png")
            or line.strip().lower().endswith(".jpg")
            or line.strip().lower().endswith(".jpeg")
            or line.strip().lower().endswith(".webp")
            or re.match(r'^(front|open/keyboard|silver|midnight|blue|red|side)\:', line.strip().lower())
            or line.strip().lower().startswith("specs:")
            or line.strip().lower().startswith("price:")
            or line.strip().lower().startswith("reviews:")
        ):
            desc_lines.append(line)
    product_desc_for_display = "\n".join(desc_lines)

    st.markdown('<div class="product-card">', unsafe_allow_html=True)
    col1, col2 = st.columns([2, 3], gap="large")

    with col1:
        if logo_files:
            st.markdown(
                "<div class='product-title-row'>"
                + "".join(
                    f"<img class='brand-logo' src='file://{os.path.abspath(lf)}'/>"
                    for lf in logo_files
                )
                + f"<span class='product-title'>{brand if brand else ''} {query.title()}</span></div>",
                unsafe_allow_html=True
            )
        else:
            st.markdown(f'<div class="product-title">{brand if brand else ""} {query.title()}</div>', unsafe_allow_html=True)

        st.markdown(f'<div class="product-desc">{strip_markdown(product_desc_for_display)}</div>', unsafe_allow_html=True)

        if specs:
            st.markdown("<hr>", unsafe_allow_html=True)
            st.markdown(f"<div class='field-label'>Specs:</div><div class='field-value'><pre style='color:#fff;background:#23242a;border:none;font-size:1.13rem;margin-bottom:0;'>{strip_markdown(specs)}</pre></div>", unsafe_allow_html=True)
        if price:
            st.markdown(f"<div class='field-label'>Price:</div> <div class='field-value'>{strip_markdown(price)}</div>", unsafe_allow_html=True)
        if reviews:
            st.markdown(f"<div class='field-label'>Reviews:</div><div class='field-value'>{strip_markdown(reviews)}</div>", unsafe_allow_html=True)
        if color:
            st.markdown(f"<div class='field-label'>Color(s):</div> <div class='field-value'>{strip_markdown(color)}</div>", unsafe_allow_html=True)
        st.button("Buy Now", key="buy", help="(Demo only)", disabled=True)

    with col2:
        if image_files:
            for img_file in image_files:
                if img_file and os.path.exists(img_file):
                    st.image(img_file, caption=img_file, width=410, use_container_width=False, output_format="auto")
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown(
        f'''
        <div class="token-box">
        <b>Token Usage Analysis</b> <br>
        <ul style="margin-bottom: 0.5rem;">
            <li><b>Simple LLM (query only):</b> ~{tokens_before} tokens</li>
            <li><b>RAG (query + context + answer):</b> ~{tokens_after} tokens</li>
        </ul>
        <i>RAG uses a bit more, but gives you real product info—no hallucinations. All local, no API key needed!</i>
        </div>
        ''',
        unsafe_allow_html=True
    )
