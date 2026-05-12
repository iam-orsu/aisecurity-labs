from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List

from models import LoginRequest, LoginResponse, UserProfile, LeaveRequest, ChatMessage, ChatResponse, GenericMessage, UploadResponse
from auth import verify_password, create_access_token, get_current_user
from database import get_db_connection
from lab1 import process_hr_chat
from lab2 import extract_text_from_file, store_document, process_doc_chat
from lab3 import process_personal_chat

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

# ── Lab 2: Document Analyzer (RAG Exploitation) ──────────

@router.post("/lab2/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload a document for AI analysis. Accepts PDF and TXT files."""
    allowed = {".pdf", ".txt"}
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")
    
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(status_code=400, detail="File too large. Max 5 MB.")
    
    text = extract_text_from_file(contents, file.filename)
    stored_chars = store_document(current_user["id"], file.filename, text)
    
    return {
        "message": f"Document '{file.filename}' analyzed successfully.",
        "filename": file.filename,
        "chars_extracted": stored_chars
    }

@router.post("/lab2/chat", response_model=ChatResponse)
async def lab2_chat(request: ChatMessage, current_user: dict = Depends(get_current_user)):
    """Chat with the Document Analyzer about uploaded documents."""
    ai_response = process_doc_chat(current_user, request.message)
    return {"response": ai_response}

# ── Lab 3: OrsuConnect Personal AI (Chat History Leakage) ─

@router.post("/lab3/chat", response_model=ChatResponse)
async def lab3_chat(request: ChatMessage, current_user: dict = Depends(get_current_user)):
    """OrsuConnect personal AI — vulnerable to compliance persona injection."""
    ai_response = process_personal_chat(current_user, request.message)
    return {"response": ai_response}
