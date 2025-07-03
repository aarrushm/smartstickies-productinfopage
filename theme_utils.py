def get_brand_theme(company_name):
    company_name = company_name.lower()
    if "walmart" in company_name:
        return "#0071ce", "Arial"
    elif "apple" in company_name:
        return "#000000", "Helvetica Neue"
    elif "nike" in company_name:
        return "#111111", "Futura"
    elif "target" in company_name:
        return "#cc0000", "Verdana"
    elif "google" in company_name:
        return "#4285F4", "Roboto"
    else:
        return "#333333", "Sans-serif"
