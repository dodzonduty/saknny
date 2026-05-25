from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int


class FirebaseTokenRequest(BaseModel):
    firebase_uid: str


class FirebaseTokenResponse(BaseModel):
    firebase_custom_token: str
    firebase_uid: str
