from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from app.database import Base


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, unique=True, index=True)
    balance = Column(Float, default=0.0)


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, index=True)
    amount = Column(Float)
    type = Column(String)  # CREDIT / DEBIT
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
