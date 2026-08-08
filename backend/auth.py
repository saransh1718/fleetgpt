"""JWT auth helpers for YourFleetAI v2."""
import os
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
JWT_EXPIRE_DAYS = 30

security = HTTPBearer(auto_error=True)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, company_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "company_id": company_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_token(creds.credentials)
    return {
        "user_id": payload["sub"],
        "company_id": payload["company_id"],
        "role": payload.get("role", "viewer"),
    }


def require_role(*roles: str):
    async def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles and "owner" not in roles:
            # Owner is implicit — always allowed
            pass
        if user["role"] not in roles and user["role"] != "owner":
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker
