from pydantic import BaseModel
from typing import List

class CartItemBase(BaseModel):
    product_id: str
    quantity: int

class CartItemInDB(CartItemBase):
    name: str
    price: float
    image: str

class CartItemCreate(CartItemBase):
    pass

class CartResponse(BaseModel):
    user_id: str
    items: List[CartItemInDB]
