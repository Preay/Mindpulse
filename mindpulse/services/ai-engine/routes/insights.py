from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from openai import OpenAI
import os

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class WeekSummary(BaseModel):
    mood_avg: float
    burnout_delta: float  # change in burnout score from previous week
    top_stressors: list[str]
    checkin_rate: float  # 0-1


class InsightGenerationRequest(BaseModel):
    user_id: str
    week_summary: WeekSummary


class InsightGenerationResponse(BaseModel):
    insight: str


def format_week_summary(summary: WeekSummary) -> str:
    """Format week summary into readable text for the AI."""
    stressor_text = ", ".join(summary.top_stressors) if summary.top_stressors else "none identified"
    
    return f"""
Weekly Mental Health Summary:
- Average Mood: {summary.mood_avg:.1f}/10
- Burnout Change: {'+' if summary.burnout_delta > 0 else ''}{summary.burnout_delta:.1f} (increasing stress if positive)
- Top Stressors: {stressor_text}
- Check-in Consistency: {summary.checkin_rate * 100:.0f}%
    """


@router.post("/insight")
async def generate_insight(request: InsightGenerationRequest) -> InsightGenerationResponse:
    """
    Generate a personalized weekly insight narrative using GPT-4o-mini.
    """
    try:
        summary_text = format_week_summary(request.week_summary)

        insight_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are a compassionate mental health coach providing weekly insights to a user. 
Based on their check-in data and patterns, provide:
1. A brief, empathetic acknowledgment of their week
2. Key observations about their mental health trends
3. 1-2 specific, actionable suggestions for the coming week

Keep the tone warm, supportive, and motivating. Be concise (2-3 paragraphs max)."""
                },
                {
                    "role": "user",
                    "content": f"Here's my week's data. Please provide an insight:\n{summary_text}"
                }
            ],
            max_tokens=400,
            temperature=0.8
        )

        insight = insight_response.choices[0].message.content

        return InsightGenerationResponse(insight=insight)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insight: {str(e)}")
