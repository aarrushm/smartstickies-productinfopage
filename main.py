from dotenv import load_dotenv
load_dotenv()

import streamlit as st
from theme_utils import get_brand_theme
from product_fetcher import generate_product_info

st.set_page_config(page_title="Product Info Generator", layout="wide")

st.title("🛍️ Adaptive Product Info Page Generator")
company = st.text_input("Enter company name (e.g., Walmart, Apple)")
product = st.text_input("Enter product name (e.g., Crossbody Bag, MacBook Air)")

if company and product:
    color, font = get_brand_theme(company)
    info = generate_product_info(company, product)

    with st.container():
        if info.get("logo_url"):
            st.image(info["logo_url"], width=100)

        col1, col2 = st.columns([1, 2])
        with col1:
            st.image(info["image_url"], use_container_width=True)
        with col2:
            st.markdown(f"<h1 style='color:{color}; font-family:{font};'>{info['name']}</h1>", unsafe_allow_html=True)
            st.markdown(f"<p style='font-family:{font}; font-size:18px;'>{info['description']}</p>", unsafe_allow_html=True)
            st.markdown(f"**Price:** {info['price']}")
            st.markdown(f"**Color:** {info['color']}")
            st.markdown(f"**Material:** {info['material']}")
            st.markdown(f"**Dimensions:** {info['dimensions']}")
