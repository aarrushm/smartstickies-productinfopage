import os

def get_brand_theme(company):
    base_path = os.path.join("assets", "fonts")
    static_path = os.path.join("static", company.lower())

    themes = {
        "Apple": {
            "title_font": os.path.join(base_path, "apple", "SF-Pro-Display-Black.ttf"),
            "body_font": os.path.join(base_path, "apple", "SF-Pro-Display-Regular.ttf"),
            "logo": os.path.join("assets", "logos", "apple_logo.png")
        },
        "Walmart": {
            "title_font": os.path.join(base_path, static_path, "Montserrat-Black.ttf"),
            "body_font": os.path.join(base_path, static_path, "Montserrat-Regular.ttf"),
            "logo": os.path.join("assets", "logos", "walmart_logo.png")
        },
        "Target": {
            "title_font": os.path.join(base_path, static_path, "Roboto-Black.ttf"),
            "body_font": os.path.join(base_path, static_path, "Roboto-Regular.ttf"),
            "logo": os.path.join("assets", "logos", "target_logo.png")
        },
        "Starbucks": {
            "title_font": os.path.join(base_path, static_path, "OpenSans-ExtraBold.ttf"),
            "body_font": os.path.join(base_path, static_path, "OpenSans-Regular.ttf"),
            "logo": os.path.join("assets", "logos", "starbucks_logo.png")
        }
    }

    return themes.get(company, {})
