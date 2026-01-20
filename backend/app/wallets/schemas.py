from pydantic import BaseModel
from typing import Literal


class WalletCreditDebit(BaseModel):
    driver_id: int
    amount: float
    reason: str
    type: Literal["CREDIT", "DEBIT"]
