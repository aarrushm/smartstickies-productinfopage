import os
from PIL import Image, ImageDraw, ImageFont
import streamlit as st
from product_fetcher import generate_product_info
from theme_utils import get_brand_theme

st.set_page_config(layout="wide")

# Enable light mode for main content and dark mode for sidebar
st.markdown("""
    <style>
        body, .main, .block-container {
            background-color: white !important;
            color: black !important;
        }
        .block-container {
            padding-top: 2rem;
        }
        h1, h2, h3, h4, h5, h6 {
            color: black !important;
        }
        .product-title {
            font-size: 32px;
            font-weight: bold;
            margin-top: 0.5rem;
            margin-bottom: 1rem;
            color: black !important;
        }
        .product-price {
            font-size: 42px;
            font-weight: bold;
            color: black;
            margin-bottom: 1rem;
        }
        .product-metadata {
            margin-left: 30px;
            font-size: 16px;
        }

        /* Sidebar dark mode */
        section[data-testid="stSidebar"] {
            background-color: #1c1f26 !important;
        }
        section[data-testid="stSidebar"] * {
            color: white !important;
        }
        section[data-testid="stSidebar"] input, section[data-testid="stSidebar"] select {
            background-color: #1c1f26 !important;
            border: 1px solid #555 !important;
            color: white !important;
            padding: 0.4rem !important;
            border-radius: 6px !important;
            margin-bottom: 1rem !important;
        }
        section[data-testid="stSidebar"] label {
            font-weight: bold;
            margin-top: 1rem;
            display: block;
        }
        section[data-testid="stSidebar"] .stTextInput label, 
        section[data-testid="stSidebar"] .stTextInput input {
            color: white !important;
        }
    </style>
""", unsafe_allow_html=True)

# Layout: Sidebar for inputs
st.sidebar.title("Adaptive Product Explorer")
company = st.sidebar.text_input("Enter Company (e.g., Apple, Walmart, etc.)")
product_name = st.sidebar.text_input("Enter a product (e.g., MacBook Air)")
product_image = st.sidebar.file_uploader("Upload a product image (PNG/JPG)", type=["png", "jpg", "jpeg"])

# Main content section
if company and product_name and product_image:
    try:
        product_data = generate_product_info(company, product_name)
    except Exception as e:
        st.error("API call failed or timed out. Please try again.")
        st.stop()

    theme = get_brand_theme(company)

    # Load fonts
    title_font = ImageFont.truetype(theme["title_font"], 40)
    body_font = ImageFont.truetype(theme["body_font"], 22)

    # Display layout in 2 columns
    col1, col2 = st.columns([2, 1])

    with col1:
        st.image(theme["logo"], width=40)
        st.markdown(f"<div class='product-title'>{product_name}</div>", unsafe_allow_html=True)

        price = product_data.get("metadata", {}).get("price")
        if price:
            st.markdown(f"<div class='product-price'>{price}</div>", unsafe_allow_html=True)

        description = product_data.get("description")
        if description and not description.lower().startswith("sure!"):
            st.markdown(description)

        metadata = product_data.get("metadata", {})
        if metadata:
            st.markdown("### Product Details")
            st.markdown("""
                <div class='product-metadata'>
            """, unsafe_allow_html=True)
            for key, value in metadata.items():
                if key.lower() != "price":
                    st.markdown(f"<p><strong>{key.title()}:</strong> {value}</p>", unsafe_allow_html=True)
            st.markdown("</div>", unsafe_allow_html=True)

        # Add Buy Now button
        st.button("Buy Now")

    with col2:
        st.image(product_image, caption=f"{product_name} Image", use_container_width=True)