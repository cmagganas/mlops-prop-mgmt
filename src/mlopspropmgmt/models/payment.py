from datetime import date
from enum import Enum
from typing import (
    Any,
    Dict,
    Optional,
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class PaymentMethod(str, Enum):
    """Payment method enumeration.

    Represents the various methods a payment can be made.
    """

    CASH = "cash"
    CHECK = "check"
    BANK_TRANSFER = "bank_transfer"
    CREDIT_CARD = "credit_card"
    MONEY_ORDER = "money_order"
    OTHER = "other"


class PaymentType(str, Enum):
    """Payment type enumeration.

    Represents the various types of payments.
    """

    RENT = "rent"
    SECURITY_DEPOSIT = "security_deposit"
    LATE_FEE = "late_fee"
    UTILITY = "utility"
    MAINTENANCE = "maintenance"
    OTHER = "other"


class PaymentBase(BaseModel):
    """Base payment information model.

    Common attributes shared by payment creation and retrieval.
    """

    lease_id: int = Field(..., description="ID of the lease this payment is for")
    tenant_id: int = Field(..., description="ID of the tenant making the payment")
    amount: float = Field(..., gt=0, description="Payment amount")
    payment_date: date = Field(..., description="Date of payment")
    payment_method: PaymentMethod = Field(..., description="Method of payment")
    payment_type: PaymentType = Field(default=PaymentType.RENT, description="Type of payment")
    memo: Optional[str] = Field(None, description="Memo or note for the payment")
    reference_number: Optional[str] = Field(None, description="Check number or reference number")
    receipt_image_url: Optional[str] = Field(None, description="URL to receipt or check image")


class PaymentCreate(PaymentBase):
    """Model for creating a new payment.

    Inherits all fields from PaymentBase, used as input model for POST requests.
    """

    pass


class Payment(PaymentBase):
    """Complete payment model including the ID.

    Used for response models to include the ID with the payment data.
    """

    payment_id: int = Field(..., description="Unique identifier for the payment")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "payment_id": 1,
                "lease_id": 1,
                "tenant_id": 1,
                "amount": 1200.00,
                "payment_date": "2023-01-05",
                "payment_method": "check",
                "payment_type": "rent",
                "memo": "January 2023 rent",
                "reference_number": "1234",
                "receipt_image_url": "https://example.com/receipts/1234.jpg",
            }
        },
    )

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Payment":
        """Create a Payment instance from a dictionary.

        Args:
            data: Dictionary containing payment data

        Returns:
            A Payment instance
        """
        return cls(**data)
