from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_chat


app = FastAPI(title="Panasonic Demo", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_chat.router, prefix="/api/chat")
