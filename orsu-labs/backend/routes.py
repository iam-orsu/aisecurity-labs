from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from models import LoginRequest, LoginResponse, UserProfile, LeaveRequest, ChatMessage, ChatResponse, GenericMessage
from auth import verify_password, create_access_token, get_current_user
from database import get_db_connection
from lab1 import process_hr_chat

router = APIRouter()

@router.get("/health", response_model=GenericMessage)
async def health_check():
    return {"message": "ok"}

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (request.email,))
    user = cursor.fetchone()
    
    if not user or not verify_password(request.password, user['password_hash']):
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    access_token = create_access_token(data={"sub": str(user['id'])})
    
    # Store session
    cursor.execute("INSERT INTO sessions (user_id, token) VALUES (?, ?)", (user['id'], access_token))
    conn.commit()
    conn.close()
    
    return {"token": access_token, "user_id": user['id'], "user_name": user['name'], "user_email": user['email']}

@router.get("/user/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "name": current_user['name'],
        "email": current_user['email'],
        "salary": current_user['salary'],
        "leaves": current_user['leaves'],
        "department": current_user['department'],
        "role": current_user['role']
    }

@router.post("/user/apply-leave", response_model=GenericMessage)
async def apply_leave(request: LeaveRequest, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO leave_requests (user_id, date, reason) VALUES (?, ?, ?)",
        (current_user['id'], request.date, request.reason)
    )
    conn.commit()
    conn.close()
    
    return {"message": f"Leave request for {request.date} sent to manager"}

@router.post("/chatbot", response_model=ChatResponse)
async def chat_with_hr(request: ChatMessage, current_user: dict = Depends(get_current_user)):
    # Process through vulnerable LLM
    ai_response = process_hr_chat(current_user, request.message)
    
    # Log the chat
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_history (user_id, message, response) VALUES (?, ?, ?)",
        (current_user['id'], request.message, ai_response)
    )
    conn.commit()
    conn.close()
    
    return {"response": ai_response}

@router.post("/logout", response_model=GenericMessage)
async def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
