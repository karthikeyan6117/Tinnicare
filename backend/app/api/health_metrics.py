from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.health_record import HealthMetric
from app.schemas.health import HealthMetricCreate, HealthMetricResponse

router = APIRouter(prefix="/health-metrics", tags=["Health Metrics"])


@router.post("", response_model=HealthMetricResponse, status_code=status.HTTP_201_CREATED)
def create_metric(
    payload: HealthMetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    metric = HealthMetric(
        patient_id=current_user.id,
        metric_type=payload.metric_type,
        metric_value=payload.metric_value,
        unit=payload.unit,
        notes=payload.notes,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return HealthMetricResponse.model_validate(metric)


@router.get("", response_model=List[HealthMetricResponse])
def list_metrics(
    metric_type: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(HealthMetric).filter(HealthMetric.patient_id == current_user.id)
    if metric_type:
        q = q.filter(HealthMetric.metric_type == metric_type)
    records = q.order_by(HealthMetric.recorded_at.desc()).offset(skip).limit(limit).all()
    return [HealthMetricResponse.model_validate(r) for r in records]


@router.get("/types")
def get_metric_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(HealthMetric.metric_type)
        .filter(HealthMetric.patient_id == current_user.id)
        .distinct()
        .all()
    )
    return {"types": [r[0] for r in records]}
