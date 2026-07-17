from pydantic import BaseModel
from typing import List
from datetime import datetime

class ShippingAddress(BaseModel):
    full_name: str
    address: str
    city: str
    zip_code: str

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItem]
    total_amount: float
    shipping_address: ShippingAddress

class OrderResponse(OrderCreate):
    id: str
    user_id: str
    created_at: str
    status: str
