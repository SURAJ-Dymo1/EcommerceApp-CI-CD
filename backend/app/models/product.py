from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    name: str
    price: float
    description: str
    category: str
    image: str

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: str
