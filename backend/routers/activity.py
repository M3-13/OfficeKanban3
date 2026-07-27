from auth import get_current_user
from database import get_db
from fastapi import APIRouter, Depends

router = APIRouter(tags=["activity"])


async def log_action(board_id: int, user_id: int, action_text: str) -> None:
    pass


@router.get("/boards/{board_id}/activity")
async def get_activity(board_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass
