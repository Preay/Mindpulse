from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Import routes
from routes.burnout import router as burnout_router
from routes.interventions import router as interventions_router
from routes.journal import router as journal_router
from routes.insights import router as insights_router

load_dotenv()

app = FastAPI(
    title="MindPulse AI Engine",
    description="AI service for MindPulse mental health tracking",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Register routers
app.include_router(burnout_router, prefix="/score", tags=["burnout"])
app.include_router(interventions_router, prefix="/recommend", tags=["interventions"])
app.include_router(journal_router, prefix="/process", tags=["journal"])
app.include_router(insights_router, prefix="/generate", tags=["insights"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
