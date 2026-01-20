from pydantic import BaseModel
from datetime import date

class DriverRegister(BaseModel):
    name: str
    phone: str
    email: str
    licence_no: str
    licence_expiry: date
    vehicle_no: str
    password: str

class DriverLogin(BaseModel):
    phone: str
    password: str
