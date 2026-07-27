from auth import get_current_user
from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models import Board, Column, Comment, Ticket, User
from schemas import SearchResult
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["search"])


@router.get("/boards/{board_id}/search", response_model=SearchResult)
async def search(
    board_id: int,
    q: str = Query(default="", min_length=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()
    if board is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board nicht gefunden")
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kein Zugriff auf dieses Board",
        )

    query = q.strip()
    if not query:
        return SearchResult(tickets=[], total=0)

    pattern = f"%{query}%"

    col_result = await db.execute(select(Column.id).where(Column.board_id == board_id))
    col_ids = col_result.scalars().all()
    if not col_ids:
        return SearchResult(tickets=[], total=0)

    title_desc_match = await db.execute(
        select(Ticket.id).where(
            Ticket.column_id.in_(col_ids),
            or_(
                Ticket.title.ilike(pattern),
                Ticket.description.ilike(pattern),
            ),
        )
    )
    ticket_ids_from_title_desc = set(title_desc_match.scalars().all())

    comment_match = await db.execute(
        select(Ticket.id)
        .distinct()
        .join(Comment, Comment.ticket_id == Ticket.id)
        .where(
            Ticket.column_id.in_(col_ids),
            Comment.content.ilike(pattern),
        )
    )
    ticket_ids_from_comments = set(comment_match.scalars().all())

    all_ticket_ids = ticket_ids_from_title_desc | ticket_ids_from_comments
    if not all_ticket_ids:
        return SearchResult(tickets=[], total=0)

    final_result = await db.execute(select(Ticket).where(Ticket.id.in_(all_ticket_ids)))
    tickets = final_result.scalars().all()

    return SearchResult(tickets=list(tickets), total=len(tickets))
