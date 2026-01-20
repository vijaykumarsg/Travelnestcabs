from sqlalchemy import Column, Integer, String, Date, DateTime
from datetime import datetime
from app.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)
    phone = Column(String, unique=True, index=True)
    email = Column(String)

    licence_no = Column(String)
    licence_expiry = Column(Date)

    vehicle_no = Column(String)

    password = Column(String)

    licence_file = Column(String)
    selfie_file = Column(String)

    status = Column(String, default="PENDING")  # PENDING / APPROVED / REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

driver_id = Column(Integer, nullable=True)
