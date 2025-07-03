import streamlit as st
from rag_pipeline import load_vector_store, generate_product_page

st.set_page_config(page_title="Smart Stickies Generator", layout="centered")

@st.cache_resource(show_spinner="Loading vector index…")
def cached_vdb():
    return load_vector_store()

st.title("📝 Smart Stickies Product-Page Generator")
st.markdown("_Powered by RAG + GPT-3o-mini_")

sku = st.text_input("Enter SKU code or product name:", placeholder="e.g. SS-123")
if st.button("Generate") and sku:
    with st.spinner("Asking the brain…"):
        vdb = cached_vdb()
        page = generate_product_page(sku, vdb)
    st.subheader("✍️ Draft Page")
    st.write(page)
    st.success("Done! Copy the draft into your CMS or tweak as needed.")
