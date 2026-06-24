from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    urgency_score: float = Field(5.0, ge=0, le=10)
    mental_load: float = Field(5.0, ge=0, le=10)
    duration_minutes: int = Field(30, ge=1)
    deadline: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    urgency_score: Optional[float] = Field(None, ge=0, le=10)
    mental_load: Optional[float] = Field(None, ge=0, le=10)
    duration_minutes: Optional[int] = Field(None, ge=1)
    deadline: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    is_archived: bool
    created_at: datetime

    class Config:
        from_attributes = True