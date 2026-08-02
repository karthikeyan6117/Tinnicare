from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.health_record import TriggerRecord
from app.schemas.health import TriggerCreate, TriggerResponse

router = APIRouter(prefix="/triggers", tags=["Triggers"])


@router.post("", response_model=TriggerResponse, status_code=status.HTTP_201_CREATED)
def create_trigger(
    payload: TriggerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = TriggerRecord(
        patient_id=current_user.id,
        trigger_type=payload.trigger_type,
        trigger_value=payload.trigger_value,
        severity_before=payload.severity_before,
        severity_after=payload.severity_after,
        notes=payload.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return TriggerResponse.model_validate(record)


@router.get("", response_model=List[TriggerResponse])
def list_triggers(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(TriggerRecord)
        .filter(TriggerRecord.patient_id == current_user.id)
        .order_by(TriggerRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [TriggerResponse.model_validate(r) for r in records]


@router.get("/insights")
def get_trigger_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(TriggerRecord)
        .filter(TriggerRecord.patient_id == current_user.id)
        .all()
    )

    trigger_counts = {}
    for r in records:
        trigger_counts[r.trigger_type] = trigger_counts.get(r.trigger_type, 0) + 1

    sorted_triggers = sorted(trigger_counts.items(), key=lambda x: x[1], reverse=True)
    return {
        "total_triggers": len(records),
        "top_triggers": [
            {"type": t, "count": c} for t, c in sorted_triggers[:10]
        ],
    }
