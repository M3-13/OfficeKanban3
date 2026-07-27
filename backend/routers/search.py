from auth import get_current_user
from database import get_db
from fastapi import APIRouter, Depends

router = APIRouter(tags=["search"])


@router.get("/boards/{board_id}/search")
async def search(
    board_id: int, q: str = "", current_user=Depends(get_current_user), db=Depends(get_db)
):
    pass
