from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

def get_company_logo(company):
    return f"https://logo.clearbit.com/{company.lower().replace(' ', '')}.com"

def fetch_product_data(product):
    return {
        "price": "$999.99",
        "color": "Silver",
        "material": "Aluminum",
        "dimensions": "13.6” W x 8.7” H x 0.44” D",
        "image_url": f"https://source.unsplash.com/600x400/?{product.replace(' ', '%20')}"
    }

def generate_product_info(company, product):
    prompt = f"Write a modern, engaging product description for the {product} sold by {company}. Be concise but vivid and include key features."

    response = client.chat.completions.create(
        model="openrouter/auto",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024
    )

    description = response.choices[0].message.content.strip()
    product_data = fetch_product_data(product)

    return {
        "name": f"{company} {product}".lower(),
        "description": description,
        "price": product_data["price"],
        "color": product_data["color"],
        "material": product_data["material"],
        "dimensions": product_data["dimensions"],
        "image_url": product_data["image_url"],
        "logo_url": get_company_logo(company)
    }
