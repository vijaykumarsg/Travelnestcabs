import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.deps import get_db

from app.auth.auth import hash_password, verify_password
from app.drivers.models import Driver
from app.drivers.schemas import DriverRegister, DriverLogin

router = APIRouter(prefix="/api/driver", tags=["Drivers"])

UPLOAD_DIR = "app/uploads/drivers"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/register")
def register_driver(
    data: DriverRegister = Depends(),
    licence_file: UploadFile = File(...),
    selfie_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if db.query(Driver).filter(Driver.phone == data.phone).first():
        raise HTTPException(400, "Driver already exists")

    licence_path = f"{UPLOAD_DIR}/{data.phone}_licence.jpg"
    selfie_path = f"{UPLOAD_DIR}/{data.phone}_selfie.jpg"

    with open(licence_path, "wb") as f:
        shutil.copyfileobj(licence_file.file, f)

    with open(selfie_path, "wb") as f:
        shutil.copyfileobj(selfie_file.file, f)

    driver = Driver(
        name=data.name,
        phone=data.phone,
        email=data.email,
        licence_no=data.licence_no,
        licence_expiry=data.licence_expiry,
        vehicle_no=data.vehicle_no,
        password=hash_password(data.password),
        licence_file=licence_path,
        selfie_file=selfie_path,
        status="PENDING"
    )

    db.add(driver)
    db.commit()

    return {"message": "Driver registered. Awaiting approval"}


@router.post("/login")
def driver_login(data: DriverLogin, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.phone == data.phone).first()

    if not driver or not verify_password(data.password, driver.password):
        raise HTTPException(401, "Invalid credentials")

    if driver.status != "APPROVED":
        raise HTTPException(403, "Driver not approved")

    return {
        "driver_id": driver.id,
        "name": driver.name,
        "status": driver.status
    }




# ===============================
# ADMIN: VIEW ALL DRIVERS
# ===============================
@router.get("/admin/drivers")
def list_drivers(db: Session = Depends(get_db)):
    drivers = db.query(Driver).order_by(Driver.created_at.desc()).all()

    return [
        {
            "id": d.id,
            "name": d.name,
            "phone": d.phone,
            "email": d.email,
            "licence_no": d.licence_no,
            "vehicle_no": d.vehicle_no,
            "status": d.status,
            "created_at": d.created_at
        }
        for d in drivers
    ]


# ===============================
# ADMIN: APPROVE DRIVER
# ===============================
@router.put("/admin/driver/{driver_id}/approve")
def approve_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    driver.status = "APPROVED"
    db.commit()

    return {"message": "Driver approved"}


# ===============================
# ADMIN: REJECT DRIVER
# ===============================
@router.put("/admin/driver/{driver_id}/reject")
def reject_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    driver.status = "REJECTED"
    db.commit()

    return {"message": "Driver rejected"}


# ===============================
# DRIVER: PROFILE
# ===============================
@router.get("/profile/{driver_id}")
def driver_profile(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    return {
        "id": driver.id,
        "name": driver.name,
        "phone": driver.phone,
        "status": driver.status,
        "vehicle_no": driver.vehicle_no
    }


# ===============================
# DRIVER: ASSIGNED TRIPS
# ===============================
@router.get("/trips/{driver_id}")
def driver_trips(driver_id: int, db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.driver_id == driver_id).all()

    return [
        {
            "booking_id": b.id,
            "booking_number": b.booking_number,
            "pickup": b.pickup,
            "drop": b.drop,
            "fare": b.price,
            "status": b.status
        }
        for b in bookings
    ]

