import os
from datetime import datetime
from app.deps import get_db

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from sqlalchemy.orm import Session

from app.database import Base, engine, SessionLocal
from app.models import Booking, Admin, Invoice
from app.schemas import (
    BookingCreate,
    AdminCreate,
    BookingStatusUpdate,
)
from app.auth.auth import hash_password, verify_password
from app.invoices.generate_invoice import generate_invoice
from app.utils.whatsapp import generate_whatsapp_link

# ===============================
# APP INIT
# ===============================
app = FastAPI(title="Travel Nest Cabs Backend")

# ===============================
# STARTUP EVENT (IMPORTANT)
# ===============================
@app.on_event("startup")
def on_startup():
    # Create DB tables
    Base.metadata.create_all(bind=engine)

    # Create default admin if not exists
    db = SessionLocal()
    try:
        if not db.query(Admin).filter(Admin.username == "admin").first():
            default_admin = Admin(
                username="admin",
                password=hash_password("admin123")
            )
            db.add(default_admin)
            db.commit()
    finally:
        db.close()

# ===============================
# CORS
# ===============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# STATIC INVOICES
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INVOICE_DIR = os.path.join(BASE_DIR, "invoices")
os.makedirs(INVOICE_DIR, exist_ok=True)
app.mount("/invoices", StaticFiles(directory=INVOICE_DIR), name="invoices")

# ===============================
# DB DEPENDENCY
# ===============================


# ===============================
# BASIC AUTH (ADMIN)
# ===============================
security = HTTPBasic()

def get_current_admin(
    credentials: HTTPBasicCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    admin = db.query(Admin).filter(Admin.username == credentials.username).first()

    if not admin or not verify_password(credentials.password, admin.password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    return admin

# ===============================
# BASE URL
# ===============================
def get_base_url():
    return "https://travelnest-backend-p13p.onrender.com"

# ===============================
# BOOKING NUMBER GENERATOR
# ===============================
def generate_booking_number(db: Session):
    from random import randint
    today = datetime.utcnow().strftime("%d/%m/%Y","%d-%m-%Y")
    return f"TNC-{today}-{randint(1000,9999)}"

# ===============================
# HEALTH CHECK
# ===============================
@app.get("/")
def home():
    return {"status": "Backend running"}

# =====================================================
# PUBLIC API — CUSTOMER BOOKING
# =====================================================
@app.post("/api/bookings", status_code=201)
def create_booking(data: BookingCreate, db: Session = Depends(get_db)):
    try:
        booking_number = generate_booking_number(db)

        booking = Booking(
            booking_number=booking_number,
            name=data.name,
            phone=data.phone,
            pickup=data.pickup,
            drop=data.drop,
            trip_type=data.trip_type,
            car=data.car,
            price=float(data.price),
            travel_date=str(data.travel_date),
            travel_time=str(data.travel_time),
            status="PENDING"
        )

        db.add(booking)
        db.commit()
        db.refresh(booking)

        return {
            "message": "Booking created successfully",
            "booking_id": booking.id,
            "booking_number": booking.booking_number
        }

    except Exception as e:
        print("🔥 BOOKING ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# ADMIN CREATE (RUN ONCE)
# =====================================================
@app.post("/api/admin/create")
async def create_admin(data: AdminCreate, db: Session = Depends(get_db)):
    if not data.username or not data.password:
        raise HTTPException(
            status_code=400,
            detail="Username and password required"
        )

    existing = db.query(Admin).filter(Admin.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")

    admin = Admin(
        username=str(data.username).strip(),
        password=hash_password(str(data.password))
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {"message": "Admin created successfully"}

# =====================================================
# ADMIN APIs
# =====================================================
@app.get("/api/admin/bookings")
def view_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    result = []

    for b in bookings:
        invoice = db.query(Invoice).filter(
            Invoice.booking_id == b.id
        ).first()

        result.append({
            "id": b.id,
            "booking_number": b.booking_number,
            "name": b.name,
            "phone": b.phone,
            "pickup": b.pickup,
            "drop": b.drop,
            "car": b.car,
            "price": b.price,
            "status": b.status,
            "created_at": b.created_at,
            "invoice_exists": bool(invoice),
            "pdf_path": invoice.pdf_path if invoice else None
        })

    return result

@app.put("/api/admin/bookings/{booking_id}")
def update_booking_status(
    booking_id: int,
    data: BookingStatusUpdate,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # ✅ normalize status
    new_status = data.status.strip().upper()
    booking.status = new_status

    whatsapp_link = None

    # ✅ invoice generation trigger
    if new_status == "COMPLETED":
        invoice = db.query(Invoice).filter(
            Invoice.booking_id == booking_id
        ).first()

        if not invoice:
            base = booking.price
            gst = round(base * 0.05, 2)
            total = base + gst

            pdf_path = generate_invoice({
                "invoice_no": booking.booking_number,
                "customer_name": booking.name,
                "pickup": booking.pickup,
                "drop": booking.drop,
                "car": booking.car,
                "travel_date": booking.travel_date,
                "base_amount": base,
                "gst_amount": gst,
                "total_amount": total,
            })

            invoice = Invoice(
                booking_id=booking.id,
                invoice_no=booking.booking_number,
                base_amount=base,
                gst_amount=gst,
                total_amount=total,
                pdf_path=pdf_path,
                status="GENERATED"
            )

            db.add(invoice)

            # ✅ final status after invoice creation
            booking.status = "INVOICED"

    # ✅ single commit at the end
    db.commit()

    return {
        "message": "Booking status updated",
        "whatsapp_link": whatsapp_link
    }


@app.get("/api/invoice/file/{booking_id}")
def open_invoice_file(booking_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.booking_id == booking_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice record not found")

    full_path = os.path.join(BASE_DIR, invoice.pdf_path)

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="PDF file missing on server")

    return FileResponse(
        path=full_path,
        media_type="application/pdf",
        filename=os.path.basename(full_path)
    )



("/api/admin/bookings/{booking_id}/assign-driver/{driver_id}")
def assign_driver(
    booking_id: int,
    driver_id: int,
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.driver_id = driver_id
    db.commit()

    return {"message": "Driver assigned to booking"}

from app.drivers.routes import router as driver_router
app.include_router(driver_router)


from app.wallets.routes import router as wallet_router
app.include_router(wallet_router)
@app.put