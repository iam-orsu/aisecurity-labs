from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Trigger reload
from database import init_db
from routes import router

app = FastAPI(title="Orsu AI Security Labs Backend")

# We allow all origins for local development ease, 
# but in a real prod environment we'd lock this down.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Initialize the database and populate initial users on startup
    init_db()

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
