import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship

from app.core.database import Base, UUIDType
from app.models.assessment import RiskLevel


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_risk = Column(Enum(RiskLevel), nullable=False)
    predicted_severity_score = Column(Float, nullable=False)
    flare_up_probability = Column(Float, nullable=True)
    model_used = Column(String(100), nullable=False)
    input_features = Column(Text, nullable=True)
    prediction_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    patient = relationship("User")
