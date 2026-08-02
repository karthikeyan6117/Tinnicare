import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate")
def generate_ai_report(
    patient_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_user_id = current_user.id
    if patient_id:
        if current_user.role.value != "doctor" and patient_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view other patient reports")
        target_user_id = patient_id

    report = langchain_service.generate_report(target_user_id, db)
    return report
