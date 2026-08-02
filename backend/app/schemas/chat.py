from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    message_id: Optional[UUID] = None
    created_at: Optional[datetime] = None


class ChatHistoryResponse(BaseModel):
    id: UUID
    message: str
    response: str
    created_at: datetime

    model_config = {"from_attributes": True}
