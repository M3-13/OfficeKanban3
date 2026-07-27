from auth import get_current_user
from database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from models import Board, Column, Comment, Ticket, User
from schemas import CommentCreate, CommentResponse, TicketCreate, TicketResponse, TicketUpdate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/tickets", tags=["tickets"])


async def _get_board_for_column(column_id: int, db: AsyncSession) -> Board:
    result = await db.execute(
        select(Column).where(Column.id == column_id).options(selectinload(Column.board))
    )
    column = result.scalar_one_or_none()
    if column is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spalte nicht gefunden")
    return column.board


async def _get_board_for_ticket(ticket_id: int, db: AsyncSession) -> tuple[Board, Ticket]:
    result = await db.execute(
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(selectinload(Ticket.column).selectinload(Column.board))
    )
    ticket = result.scalar_one_or_none()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket nicht gefunden")
    return ticket.column.board, ticket


async def _check_column_wip(
    column_id: int, db: AsyncSession, exclude_ticket_id: int | None = None
) -> None:
    result = await db.execute(
        select(Column).where(Column.id == column_id).options(selectinload(Column.tickets))
    )
    column = result.scalar_one_or_none()
    if column is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spalte nicht gefunden")
    if column.wip_limit is not None:
        ticket_count = len([t for t in column.tickets if t.id != exclude_ticket_id])
        if ticket_count >= column.wip_limit:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f'WIP-Limit von {column.wip_limit} für Spalte "{column.name}" erreicht',
            )


@router.get("/columns/{column_id}/tickets", response_model=list[TicketResponse])
async def list_tickets(
    column_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board = await _get_board_for_column(column_id, db)
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Kein Zugriff auf dieses Board"
        )
    result = await db.execute(select(Ticket).where(Ticket.column_id == column_id))
    return result.scalars().all()


@router.post(
    "/columns/{column_id}/tickets",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ticket(
    column_id: int,
    body: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board = await _get_board_for_column(column_id, db)
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Kein Zugriff auf dieses Board"
        )
    await _check_column_wip(column_id, db)

    ticket = Ticket(
        column_id=column_id,
        title=body.title,
        description=body.description,
        priority=body.priority,
        due_date=body.due_date,
        assignee_id=body.assignee_id,
        tags=body.tags,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board, ticket = await _get_board_for_ticket(ticket_id, db)
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Kein Zugriff auf dieses Board"
        )
    return ticket


@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    body: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board, ticket = await _get_board_for_ticket(ticket_id, db)
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Kein Zugriff auf dieses Board"
        )

    update_data = body.model_dump(exclude_unset=True)

    if "column_id" in update_data:
        new_column_id = update_data.pop("column_id")
        if new_column_id != ticket.column_id:
            new_board = await _get_board_for_column(new_column_id, db)
            if new_board.id != board.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Zielspalte gehört nicht zum selben Board",
                )
            await _check_column_wip(new_column_id, db, exclude_ticket_id=ticket.id)
            ticket.column_id = new_column_id

    for key, value in update_data.items():
        setattr(ticket, key, value)

    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board, ticket = await _get_board_for_ticket(ticket_id, db)
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Kein Zugriff auf dieses Board"
        )
    await db.delete(ticket)
    await db.commit()


@router.post(
    "/{ticket_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED
)
async def create_comment(
    ticket_id: int,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board, _ = await _get_board_for_ticket(ticket_id, db)
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Kein Zugriff auf dieses Board"
        )
    comment = Comment(
        ticket_id=ticket_id,
        author_id=current_user.id,
        content=body.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


@router.get("/{ticket_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board, _ = await _get_board_for_ticket(ticket_id, db)
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Kein Zugriff auf dieses Board"
        )
    result = await db.execute(
        select(Comment).where(Comment.ticket_id == ticket_id).order_by(Comment.created_at.asc())
    )
    return result.scalars().all()


@router.delete("/{ticket_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    ticket_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board, _ = await _get_board_for_ticket(ticket_id, db)
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Kein Zugriff auf dieses Board"
        )
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.ticket_id == ticket_id)
    )
    comment = result.scalar_one_or_none()
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Kommentar nicht gefunden"
        )
    await db.delete(comment)
    await db.commit()
