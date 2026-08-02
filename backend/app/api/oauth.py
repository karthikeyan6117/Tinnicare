import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User, OAuthAccount, UserRole
from app.schemas.user import TokenResponse, UserResponse

router = APIRouter(prefix="/oauth", tags=["OAuth"])

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.post("/google", response_model=TokenResponse)
async def google_login(code: str, db: Session = Depends(get_db)):
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": "tinnicare://oauth/callback",
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data=token_data)
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")

        access_token = token_resp.json().get("access_token")
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")

        google_user = userinfo_resp.json()

    google_id = google_user["id"]
    email = google_user["email"]
    name = google_user.get("name", email.split("@")[0])
    avatar = google_user.get("picture")

    account = db.query(OAuthAccount).filter(
        OAuthAccount.provider == "google",
        OAuthAccount.provider_account_id == google_id,
    ).first()

    if account:
        user = account.user
    else:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            oauth_account = OAuthAccount(
                user_id=existing_user.id,
                provider="google",
                provider_account_id=google_id,
            )
            db.add(oauth_account)
            user = existing_user
        else:
            user = User(
                email=email,
                full_name=name,
                role=UserRole.PATIENT,
                avatar_url=avatar,
                email_verified=True,
            )
            db.add(user)
            db.flush()

            oauth_account = OAuthAccount(
                user_id=user.id,
                provider="google",
                provider_account_id=google_id,
            )
            db.add(oauth_account)

        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )
