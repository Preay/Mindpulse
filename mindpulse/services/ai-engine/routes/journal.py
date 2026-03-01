from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import base64
import tempfile
from openai import OpenAI

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class JournalProcessRequest(BaseModel):
    user_id: str
    audio_base64: Optional[str] = None
    text: Optional[str] = None


class JournalProcessResponse(BaseModel):
    transcript: Optional[str] = None
    summary: str
    themes: list[str]
    sentiment: float  # -1.0 to 1.0


EMOTION_KEYWORDS = {
    "work_stress": ["meeting", "deadline", "project", "boss", "work", "pressure", "colleague"],
    "relationships": ["friend", "family", "partner", "spouse", "colleague", "relationship"],
    "health": ["tired", "sick", "pain", "illness", "exercise", "health"],
    "financial": ["money", "debt", "expense", "pay", "financial"],
    "personal_growth": ["learn", "improve", "grow", "skill", "goal", "progress"],
    "anxiety": ["worried", "anxious", "nervous", "fear", "unsure"],
    "happiness": ["happy", "excited", "joy", "grateful", "blessed"],
    "sadness": ["sad", "depressed", "down", "unhappy", "lonely"],
}


def extract_themes(text: str) -> list[str]:
    """Extract themes from text based on keyword matching."""
    text_lower = text.lower()
    themes = []

    for theme, keywords in EMOTION_KEYWORDS.items():
        if any(keyword in text_lower for keyword in keywords):
            themes.append(theme)

    return themes


def calculate_sentiment(text: str) -> float:
    """
    Calculate sentiment score (-1.0 to 1.0) based on positive/negative words.
    This is a simplified rule-based approach.
    """
    positive_words = [
        "happy", "excited", "great", "wonderful", "love", "amazing", "good",
        "grateful", "blessed", "proud", "accomplished", "successful"
    ]
    negative_words = [
        "sad", "angry", "frustrated", "disappointed", "hate", "terrible", "awful",
        "depressed", "anxious", "worried", "stressed", "overwhelmed"
    ]

    text_lower = text.lower()
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)

    total = positive_count + negative_count
    if total == 0:
        return 0.0

    sentiment = (positive_count - negative_count) / total
    return max(-1.0, min(1.0, sentiment))


@router.post("/journal")
async def process_journal(request: JournalProcessRequest) -> JournalProcessResponse:
    """
    Process journal entry (voice or text).
    - Transcribe audio using Whisper
    - Summarize using GPT-4o-mini
    - Extract themes and sentiment
    """
    try:
        transcript = None
        text_content = request.text

        # Process audio if provided
        if request.audio_base64:
            try:
                # Decode base64 audio
                audio_data = base64.b64decode(request.audio_base64)

                # Create temporary file for audio
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    tmp.write(audio_data)
                    tmp_path = tmp.name

                # Transcribe using Whisper
                with open(tmp_path, "rb") as audio_file:
                    transcript_response = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language="en"
                    )
                    transcript = transcript_response.text

                # Clean up temporary file
                os.unlink(tmp_path)

                text_content = transcript
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing audio: {str(e)}")

        if not text_content:
            raise HTTPException(status_code=400, detail="No audio or text provided")

        # Generate summary using GPT-4o-mini
        try:
            summary_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that summarizes journal entries concisely in 2-3 sentences, capturing the main emotions and events."
                    },
                    {
                        "role": "user",
                        "content": f"Please summarize this journal entry:\n\n{text_content}"
                    }
                ],
                max_tokens=150,
                temperature=0.7
            )
            summary = summary_response.choices[0].message.content
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

        # Extract themes and sentiment
        themes = extract_themes(text_content)
        sentiment = calculate_sentiment(text_content)

        return JournalProcessResponse(
            transcript=transcript,
            summary=summary,
            themes=themes,
            sentiment=sentiment
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing journal: {str(e)}")
