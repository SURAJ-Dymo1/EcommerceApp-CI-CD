from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr
    is_admin: bool = False

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserInDB(UserBase):
    hashed_password: str

class UserResponse(UserBase):
    id: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
