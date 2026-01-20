from urllib.parse import quote

def generate_whatsapp_link(phone, invoice_url):

    message = f"""
Hello,

Your Travel Nest Cabs invoice is ready ✅

📄 Invoice: {invoice_url}

Thank you for choosing Travel Nest Cabs 🚖
Have a safe journey!
"""

    encoded = quote(message)

    return f"https://wa.me/{phone}?text={encoded}"
