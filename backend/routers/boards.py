from auth import get_current_user
from database import get_db
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/boards", tags=["boards"])


@router.get("/")
async def list_boards(current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.post("/")
async def create_board(current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.get("/{board_id}")
async def get_board(board_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.put("/{board_id}")
async def update_board(board_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.delete("/{board_id}")
async def delete_board(board_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.get("/{board_id}/columns")
async def list_columns(board_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.post("/{board_id}/columns")
async def create_column(board_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.put("/{board_id}/columns/{column_id}")
async def update_column(
    board_id: int, column_id: int, current_user=Depends(get_current_user), db=Depends(get_db)
):
    pass


@router.delete("/{board_id}/columns/{column_id}")
async def delete_column(
    board_id: int, column_id: int, current_user=Depends(get_current_user), db=Depends(get_db)
):
    pass
