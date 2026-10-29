
# ==========================================
# TRYONIX - AI SHOPPING ASSISTANT ROUTES
# WITH CONVERSATION MEMORY
# ==========================================

from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.assistant.chatbot import (
    generate_chat_response,
    create_conversation_id,
    clear_conversation,
)


# ==========================================
# INITIALIZE ASSISTANT ROUTER
# ==========================================

router = APIRouter(
    prefix="/assistant",
    tags=["AI Shopping Assistant"],
)


# ==========================================
# REQUEST SCHEMA
# ==========================================

class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000,
    )

    conversation_id: UUID | None = None


# ==========================================
# RESPONSE SCHEMA
# ==========================================

class ChatResponse(BaseModel):
    message: str
    response: str
    conversation_id: str


# ==========================================
# HEALTH CHECK
# ==========================================

@router.get("/health")
def assistant_health():
    return {
        "status": "healthy",
        "service": (
            "TRYONIX AI Shopping Assistant"
        ),
        "conversation_memory": "enabled",
    }


# ==========================================
# AI CHAT ENDPOINT
# ==========================================

@router.post(
    "/chat",
    response_model=ChatResponse,
)
def assistant_chat(
    request: ChatRequest,
):

    conversation_id = (
        str(request.conversation_id)
        if request.conversation_id
        else create_conversation_id()
    )

    response = generate_chat_response(
        message=request.message,
        conversation_id=conversation_id,
    )

    return ChatResponse(
        message=request.message,
        response=response,
        conversation_id=conversation_id,
    )


# ==========================================
# CLEAR CONVERSATION MEMORY
# ==========================================

class ClearConversationRequest(BaseModel):
    conversation_id: UUID


@router.post("/clear")
def clear_assistant_conversation(
    request: ClearConversationRequest,
):

    clear_conversation(
        str(request.conversation_id)
    )

    return {
        "status": "success",
        "message": (
            "Conversation memory cleared."
        ),
    }
