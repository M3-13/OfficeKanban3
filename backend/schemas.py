import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class BoardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class BoardResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class ColumnCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    position: int = 0
    wip_limit: int | None = None


class ColumnResponse(BaseModel):
    id: int
    board_id: int
    name: str
    position: int
    wip_limit: int | None

    model_config = {"from_attributes": True}


class TicketCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    priority: int = Field(default=3, ge=1, le=5)
    due_date: datetime.date | None = None
    assignee_id: int | None = None
    tags: list[str] | None = None


class TicketResponse(BaseModel):
    id: int
    column_id: int
    title: str
    description: str | None
    priority: int
    due_date: datetime.date | None
    assignee_id: int | None
    tags: list | None

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str = Field(min_length=1)


class CommentResponse(BaseModel):
    id: int
    ticket_id: int
    author_id: int
    content: str
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class ActivityLogResponse(BaseModel):
    id: int
    board_id: int
    user_id: int
    action_text: str
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class SearchResult(BaseModel):
    tickets: list[TicketResponse]
    total: int
