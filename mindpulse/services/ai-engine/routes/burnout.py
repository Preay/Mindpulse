from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import statistics

router = APIRouter()

class CheckInData(BaseModel):
    mood_score: int
    energy_score: int
    stress_score: int
    checked_at: str


class BurnoutScoreRequest(BaseModel):
    user_id: str
    checkins_14d: List[Dict[str, Any]]
    calendar_density: float
    checkin_rate: float


class BurnoutScoreResponse(BaseModel):
    score: float
    risk_level: str
    factors: Dict[str, Any]


def calculate_burnout_score(checkins: List[Dict], calendar_density: float, checkin_rate: float) -> BurnoutScoreResponse:
    """
    Calculate burnout score using rule-based logic.
    Values: 0-100, where higher = more burnout
    """
    if not checkins or len(checkins) < 7:
        raise ValueError("Insufficient data for burnout calculation")

    # Extract scores
    mood_scores = [c.get('mood_score', 5) for c in checkins]
    energy_scores = [c.get('energy_score', 5) for c in checkins]
    stress_scores = [c.get('stress_score', 5) for c in checkins]

    # Calculate averages
    avg_mood = statistics.mean(mood_scores)
    avg_energy = statistics.mean(energy_scores)
    avg_stress = statistics.mean(stress_scores)

    # Calculate standard deviations for volatility
    mood_stdev = statistics.stdev(mood_scores) if len(mood_scores) > 1 else 0
    energy_stdev = statistics.stdev(energy_scores) if len(energy_scores) > 1 else 0
    stress_stdev = statistics.stdev(stress_scores) if len(stress_scores) > 1 else 0

    # Burnout indicators:
    # 1. Low mood (< 5)
    # 2. Low energy (< 4)
    # 3. High stress (> 7)
    # 4. High volatility in mood/energy
    # 5. Low check-in consistency
    # 6. Calendar overload

    # Score factors (0-100)
    mood_factor = max(0, (5 - avg_mood) / 5 * 100)  # 0-100, higher = worse
    energy_factor = max(0, (5 - avg_energy) / 5 * 100)  # 0-100, higher = worse
    stress_factor = (avg_stress / 10) * 100  # 0-100, higher = worse
    volatility_factor = ((mood_stdev + energy_stdev) / 2) * 20  # 0-100 scale
    checkin_consistency = min(100, checkin_rate * 100)  # 0-100
    calendar_factor = calendar_density * 100  # 0-100

    # Weighted average burnout score
    weights = {
        'mood': 0.25,
        'energy': 0.25,
        'stress': 0.20,
        'volatility': 0.15,
        'checkin': 0.05,
        'calendar': 0.10
    }

    burnout_score = (
        mood_factor * weights['mood'] +
        energy_factor * weights['energy'] +
        stress_factor * weights['stress'] +
        volatility_factor * weights['volatility'] +
        (100 - checkin_consistency) * weights['checkin'] +  # Inverted: low consistency = higher burnout
        calendar_factor * weights['calendar']
    )

    # Cap the score
    burnout_score = min(100, max(0, burnout_score))

    # Determine risk level
    if burnout_score < 20:
        risk_level = "low"
    elif burnout_score < 40:
        risk_level = "moderate"
    elif burnout_score < 70:
        risk_level = "high"
    else:
        risk_level = "critical"

    # Compile factors
    factors = {
        "mood_score": round(avg_mood, 2),
        "energy_score": round(avg_energy, 2),
        "stress_score": round(avg_stress, 2),
        "mood_volatility": round(mood_stdev, 2),
        "energy_volatility": round(energy_stdev, 2),
        "stress_volatility": round(stress_stdev, 2),
        "checkin_rate": round(checkin_rate, 2),
        "calendar_density": round(calendar_density, 2),
        "top_factors": []
    }

    # Identify top contributing factors
    if avg_mood < 5:
        factors["top_factors"].append("Low mood")
    if avg_energy < 4:
        factors["top_factors"].append("Low energy")
    if avg_stress > 7:
        factors["top_factors"].append("High stress")
    if volatility_factor > 30:
        factors["top_factors"].append("Inconsistent emotional state")
    if calendar_density > 0.7:
        factors["top_factors"].append("Overbooked schedule")

    return BurnoutScoreResponse(
        score=round(burnout_score, 2),
        risk_level=risk_level,
        factors=factors
    )


@router.post("/burnout")
async def score_burnout(request: BurnoutScoreRequest) -> BurnoutScoreResponse:
    """
    Calculate burnout score based on check-ins, calendar data, and consistency.
    """
    try:
        response = calculate_burnout_score(
            request.checkins_14d,
            request.calendar_density,
            request.checkin_rate
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error calculating burnout score")
