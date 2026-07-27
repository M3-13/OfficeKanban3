from auth import get_current_user
from database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from models import Board, Column, User
from schemas import BoardCreate, BoardResponse, ColumnCreate, ColumnResponse, ColumnUpdate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/boards", tags=["boards"])


async def _get_board_or_404(board_id: int, user: User, db: AsyncSession) -> Board:
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()
    if board is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board nicht gefunden")
    if board.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Kein Zugriff auf dieses Board"
        )
    return board


async def _get_column_or_404(column_id: int, board_id: int, db: AsyncSession) -> Column:
    result = await db.execute(
        select(Column).where(Column.id == column_id, Column.board_id == board_id)
    )
    column = result.scalar_one_or_none()
    if column is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spalte nicht gefunden")
    return column


@router.get("/", response_model=list[BoardResponse])
async def list_boards(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Board).where(Board.owner_id == current_user.id).order_by(Board.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def create_board(
    body: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board = Board(name=body.name, owner_id=current_user.id)
    db.add(board)
    await db.commit()
    await db.refresh(board)
    return board


@router.get("/{board_id}", response_model=BoardResponse)
async def get_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_board_or_404(board_id, current_user, db)


@router.put("/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: int,
    body: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board = await _get_board_or_404(board_id, current_user, db)
    board.name = body.name
    await db.commit()
    await db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board = await _get_board_or_404(board_id, current_user, db)
    await db.delete(board)
    await db.commit()


@router.get("/{board_id}/columns", response_model=list[ColumnResponse])
async def list_columns(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_board_or_404(board_id, current_user, db)
    result = await db.execute(
        select(Column)
        .where(Column.board_id == board_id)
        .order_by(Column.position)
        .options(selectinload(Column.tickets))
    )
    return result.scalars().all()


@router.post(
    "/{board_id}/columns", response_model=ColumnResponse, status_code=status.HTTP_201_CREATED
)
async def create_column(
    board_id: int,
    body: ColumnCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_board_or_404(board_id, current_user, db)
    column = Column(
        board_id=board_id,
        name=body.name,
        position=body.position,
        wip_limit=body.wip_limit,
    )
    db.add(column)
    await db.commit()
    await db.refresh(column)
    return column


@router.put("/{board_id}/columns/{column_id}", response_model=ColumnResponse)
async def update_column(
    board_id: int,
    column_id: int,
    body: ColumnUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_board_or_404(board_id, current_user, db)
    column = await _get_column_or_404(column_id, board_id, db)
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(column, key, value)
    await db.commit()
    await db.refresh(column)
    return column


@router.delete("/{board_id}/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(
    board_id: int,
    column_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_board_or_404(board_id, current_user, db)
    column = await _get_column_or_404(column_id, board_id, db)
    await db.delete(column)
    await db.commit()
