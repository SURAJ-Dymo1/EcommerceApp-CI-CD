from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from app.core.config import settings
from app.core import security
from app.db.mongodb import db
from app.models.user import UserCreate, UserResponse, UserInDB, Token, TokenData
from bson import ObjectId

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    user_db = await db.db["users"].find_one({"username": token_data.username})
    if user_db is None:
        raise credentials_exception
    
    # Map bson ID to str id
    user_db["id"] = str(user_db["_id"])
    return user_db

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate):
    # Check if username or email already exists
    existing_user = await db.db["users"].find_one({
        "$or": [
            {"username": user_in.username},
            {"email": user_in.email}
        ]
    })
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Hash password and insert
    hashed_password = security.get_password_hash(user_in.password)
    user_dict = {
        "username": user_in.username,
        "email": user_in.email,
        "hashed_password": hashed_password,
        # First registered user is admin, or username starting with admin
        "is_admin": user_in.username.startswith("admin")
    }
    
    res = await db.db["users"].insert_one(user_dict)
    
    return {
        "id": str(res.inserted_id),
        "username": user_in.username,
        "email": user_in.email,
        "is_admin": user_dict["is_admin"]
    }

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.db["users"].find_one({
        "$or": [
            {"username": form_data.username},
            {"email": form_data.username}
        ]
    })
    if not user or not security.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(subject=user["username"])
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "is_admin": current_user.get("is_admin", False)
    }
