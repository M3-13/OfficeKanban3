from auth import get_current_user
from database import get_db
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/columns/{column_id}/tickets")
async def list_tickets(column_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.post("/columns/{column_id}/tickets")
async def create_ticket(column_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.put("/{ticket_id}")
async def update_ticket(ticket_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.delete("/{ticket_id}")
async def delete_ticket(ticket_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.post("/{ticket_id}/comments")
async def create_comment(
    ticket_id: int, current_user=Depends(get_current_user), db=Depends(get_db)
):
    pass


@router.get("/{ticket_id}/comments")
async def list_comments(ticket_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    pass


@router.delete("/{ticket_id}/comments/{comment_id}")
async def delete_comment(
    ticket_id: int, comment_id: int, current_user=Depends(get_current_user), db=Depends(get_db)
):
    pass
