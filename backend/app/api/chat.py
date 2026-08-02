import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.chat import ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse
from app.services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message", response_model=ChatResponse)
def chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        response_text = langchain_service.chat(current_user.id, payload.message, db)
    except Exception as e:
        logger.warning(f"LangChain service chat failed: {e}")
        response_text = "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment. If you're experiencing a medical emergency, please contact a healthcare professional immediately."

    chat_msg = ChatMessage(
        user_id=current_user.id,
        message=payload.message,
        response=response_text,
    )
    db.add(chat_msg)
    db.commit()
    db.refresh(chat_msg)

    return ChatResponse(
        response=response_text,
        message_id=chat_msg.id,
        created_at=chat_msg.created_at,
    )


@router.get("/history", response_model=List[ChatHistoryResponse])
def chat_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    return [ChatHistoryResponse.model_validate(m) for m in messages]
