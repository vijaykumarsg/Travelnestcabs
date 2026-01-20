from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db
from app.wallets.models import Wallet, WalletTransaction
from app.wallets.schemas import WalletCreditDebit

router = APIRouter(prefix="/api/wallet", tags=["Wallet"])


# -------------------------
# GET DRIVER WALLET
# -------------------------
@router.get("/{driver_id}")
def get_wallet(driver_id: int, db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter(Wallet.driver_id == driver_id).first()

    if not wallet:
        wallet = Wallet(driver_id=driver_id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    return {
        "driver_id": wallet.driver_id,
        "balance": wallet.balance
    }


# -------------------------
# CREDIT / DEBIT WALLET (ADMIN / SYSTEM)
# -------------------------
@router.post("/transaction")
def wallet_transaction(
    data: WalletCreditDebit,
    db: Session = Depends(get_db)
):
    wallet = db.query(Wallet).filter(Wallet.driver_id == data.driver_id).first()

    if not wallet:
        wallet = Wallet(driver_id=data.driver_id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    if data.type == "DEBIT" and wallet.balance < data.amount:
        raise HTTPException(400, "Insufficient wallet balance")

    if data.type == "CREDIT":
        wallet.balance += data.amount
    else:
        wallet.balance -= data.amount

    txn = WalletTransaction(
        driver_id=data.driver_id,
        amount=data.amount,
        type=data.type,
        reason=data.reason
    )

    db.add(txn)
    db.commit()

    return {
        "message": "Wallet updated",
        "balance": wallet.balance
    }
