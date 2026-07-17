from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.mongodb import db
from app.models.product import ProductCreate, ProductResponse
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId

router = APIRouter()

# Default seed products
DEFAULT_PRODUCTS = [
  { "name": "Apex Wireless Headphones", "price": 299.99, "description": "Active noise-canceling headphones with studio-quality audio reproduction.", "category": "Audio", "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" },
  { "name": "Tactile Mechanical Keyboard", "price": 149.99, "description": "RGB backlit mechanical keyboard with hot-swappable switches.", "category": "Peripherals", "image": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80" },
  { "name": "UltraWide Curved Monitor", "price": 699.99, "description": "34-inch curved gaming monitor with 144Hz refresh rate and HDR.", "category": "Displays", "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80" },
  { "name": "Leather Commuter Backpack", "price": 119.99, "description": "Minimalist waterproof leather backpack for everyday office and travel use.", "category": "Lifestyle", "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80" },
  { "name": "Ergonomic Wireless Mouse", "price": 79.99, "description": "Precision wireless mouse with customizable buttons and long battery life.", "category": "Peripherals", "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80" },
  { "name": "True Wireless Earbuds", "price": 129.99, "description": "IPX7 waterproof earbuds with touch controls and wireless charging case.", "category": "Audio", "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80" }
]

async def seed_products_if_empty():
    count = await db.db["products"].count_documents({})
    if count == 0:
        await db.db["products"].insert_many(DEFAULT_PRODUCTS)

@router.get("", response_model=List[ProductResponse])
async def list_products():
    await seed_products_if_empty()
    cursor = db.db["products"].find()
    products = []
    async for document in cursor:
        document["id"] = str(document["_id"])
        products.append(document)
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    product = await db.db["products"].find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["id"] = str(product["_id"])
    return product

@router.post("", response_model=ProductResponse)
async def create_product(product_in: ProductCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can manage products"
        )
    
    product_dict = product_in.model_dump()
    res = await db.db["products"].insert_one(product_dict)
    product_dict["id"] = str(res.inserted_id)
    return product_dict

@router.delete("/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can manage products"
        )
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
        
    res = await db.db["products"].delete_one({"_id": ObjectId(product_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return {"status": "success", "message": "Product deleted successfully"}
