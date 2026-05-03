from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.student import Student
from backend.app.models.admin import Admin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    if role == "student":
        user = db.query(Student).filter(Student.student_id == int(user_id)).first()
    elif role == "admin":
        user = db.query(Admin).filter(Admin.admin_id == int(user_id)).first()
    else:
        raise credentials_exception

    if user is None:
        raise credentials_exception
    
    # Store role on the user object dynamically for downstream checks
    user.role_type = role 
    return user

def get_current_student(current_user = Depends(get_current_user)):
    if current_user.role_type != "student":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

def get_current_admin(current_user = Depends(get_current_user)):
    if current_user.role_type != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user
