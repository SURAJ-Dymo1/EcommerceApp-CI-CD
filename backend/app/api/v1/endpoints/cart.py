from fastapi import APIRouter, Depends, HTTPException, status
from app.db.mongodb import db
from app.models.cart import CartItemCreate, CartResponse, CartItemInDB
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId

router = APIRouter()

@router.get("", response_model=CartResponse)
async def get_cart(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    cart = await db.db["carts"].find_one({"user_id": user_id})
    if not cart:
        return {"user_id": user_id, "items": []}
    return cart

@router.post("/items", response_model=CartResponse)
async def add_to_cart(item_in: CartItemCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Verify product exists
    if not ObjectId.is_valid(item_in.product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    product = await db.db["products"].find_one({"_id": ObjectId(item_in.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get user's cart
    cart = await db.db["carts"].find_one({"user_id": user_id})
    if not cart:
        cart = {"user_id": user_id, "items": []}
        
    items = cart["items"]
    # Check if item exists in cart
    existing_item = next((item for item in items if item["product_id"] == item_in.product_id), None)
    if existing_item:
        existing_item["quantity"] += item_in.quantity
    else:
        items.append({
            "product_id": item_in.product_id,
            "quantity": item_in.quantity,
            "name": product["name"],
            "price": product["price"],
            "image": product["image"]
        })
        
    await db.db["carts"].update_one(
        {"user_id": user_id},
        {"$set": {"items": items}},
        upsert=True
    )
    
    return {"user_id": user_id, "items": items}

@router.delete("/items/{product_id}", response_model=CartResponse)
async def remove_from_cart(product_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    cart = await db.db["carts"].find_one({"user_id": user_id})
    if not cart:
        return {"user_id": user_id, "items": []}
        
    items = [item for item in cart["items"] if item["product_id"] != product_id]
    await db.db["carts"].update_one(
        {"user_id": user_id},
        {"$set": {"items": items}}
    )
    return {"user_id": user_id, "items": items}

@router.delete("", response_model=CartResponse)
async def clear_cart(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    await db.db["carts"].delete_one({"user_id": user_id})
    return {"user_id": user_id, "items": []}
