from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.mongodb import db
from app.models.order import OrderCreate, OrderResponse
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("", response_model=OrderResponse)
async def create_order(order_in: OrderCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    order_dict = order_in.model_dump()
    order_dict["user_id"] = user_id
    order_dict["created_at"] = datetime.now().isoformat()
    order_dict["status"] = "processing"
    
    res = await db.db["orders"].insert_one(order_dict)
    order_dict["id"] = str(res.inserted_id)
    return order_dict

@router.get("", response_model=List[OrderResponse])
async def list_my_orders(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    cursor = db.db["orders"].find({"user_id": user_id})
    orders = []
    async for document in cursor:
        document["id"] = str(document["_id"])
        orders.append(document)
    return orders

@router.get("/all", response_model=List[OrderResponse])
async def list_all_orders(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can list all orders"
        )
    cursor = db.db["orders"].find()
    orders = []
    async for document in cursor:
        document["id"] = str(document["_id"])
        orders.append(document)
    return orders
