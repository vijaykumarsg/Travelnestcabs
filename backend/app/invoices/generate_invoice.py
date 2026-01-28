import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime


def generate_invoice(data: dict) -> str:
    """
    Generates GST Invoice PDF
    Returns ABSOLUTE file path (Render-safe)
    """

    # ----------------------------------------------------
    # ✅ CORRECT, SINGLE invoices DIRECTORY
    # ----------------------------------------------------
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    INVOICE_DIR = BASE_DIR   # app/invoices/

    os.makedirs(INVOICE_DIR, exist_ok=True)

    invoice_no = data["invoice_no"]
    filename = f"{invoice_no}.pdf"

    # ✅ ABSOLUTE PATH (this is critical)
    file_path = os.path.join(INVOICE_DIR, filename)
    # ----------------------------------------------------

    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4
    y = height - 50

    # -------------------
    # HEADER
    # -------------------
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, y, "TAX INVOICE")

    y -= 30
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 50, y, f"Invoice No: {invoice_no}")
    y -= 15
    c.drawRightString(width - 50, y, f"Date: {datetime.now().strftime('%d-%m-%Y')}")

    y -= 30

    # -------------------
    # COMPANY DETAILS
    # -------------------
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Travel Nest Cabs")

    y -= 15
    c.setFont("Helvetica", 10)
    c.drawString(50, y, "GSTIN: 29ABCDE1234F1Z5")
    y -= 15
    c.drawString(50, y, "Bengaluru, Karnataka, India")

    y -= 30

    # -------------------
    # CUSTOMER DETAILS
    # -------------------
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Billed To:")

    y -= 15
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Customer Name: {data['customer_name']}")
    y -= 15
    c.drawString(50, y, f"Route: {data['pickup']} → {data['drop']}")
    y -= 15
    c.drawString(50, y, f"Vehicle: {data['car']}")
    y -= 15
    c.drawString(50, y, f"Travel Date: {data['travel_date']}")

    y -= 30

    # -------------------
    # FARE DETAILS
    # -------------------
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Fare Details")

    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(50, y, "Base Fare:")
    c.drawRightString(width - 50, y, f"₹ {data['base_amount']:.2f}")

    y -= 15
    c.drawString(50, y, "GST @ 5%:")
    c.drawRightString(width - 50, y, f"₹ {data['gst_amount']:.2f}")

    y -= 15
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Total Amount:")
    c.drawRightString(width - 50, y, f"₹ {data['total_amount']:.2f}")

    y -= 40

    # -------------------
    # FOOTER
    # -------------------
    c.setFont("Helvetica", 9)
    c.drawString(
        50,
        y,
        "Note: This is a computer-generated GST invoice. No signature required."
    )

    c.showPage()
    c.save()

    print("✅ INVOICE SAVED AT:", file_path)

    # ✅ RETURN ABSOLUTE PATH (THIS FIXES EVERYTHING)
    return file_path
