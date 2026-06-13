from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str | None = None
    firebase_uid: str | None = None


class FirebaseTokenRequest(BaseModel):
    firebase_uid: str


class FirebaseTokenResponse(BaseModel):
    firebase_custom_token: str
    firebase_uid: str

class FirebaseLoginRequest(BaseModel):
    token: str
