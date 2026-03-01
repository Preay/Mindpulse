from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import random

router = APIRouter()

class InterventionRating(BaseModel):
    intervention_id: str
    rating: float  # 1-5


class InterventionRecommendationRequest(BaseModel):
    user_id: str
    current_stress: int  # 1-10
    time_of_day: str  # morning, afternoon, evening
    calendar_gap_minutes: int  # minutes until next meeting
    past_ratings: List[InterventionRating]


class InterventionRecommendation(BaseModel):
    id: str
    type: str
    title: str
    reason: str
    duration_seconds: int


class InterventionRecommendationResponse(BaseModel):
    interventions: List[InterventionRecommendation]


# Base interventions database
INTERVENTIONS_DB = {
    "breathing": [
        {
            "id": "breathing-1",
            "type": "breathing",
            "title": "4-7-8 Breathing Exercise",
            "duration_seconds": 180,
            "best_for": ["high stress", "anxiety"],
            "best_time": ["morning", "afternoon", "evening"],
            "min_duration_minutes": 3
        },
        {
            "id": "breathing-2",
            "type": "breathing",
            "title": "Box Breathing",
            "duration_seconds": 240,
            "best_for": ["panic", "focus"],
            "best_time": ["afternoon", "evening"],
            "min_duration_minutes": 4
        }
    ],
    "reframe": [
        {
            "id": "reframe-1",
            "type": "reframe",
            "title": "Thought Record",
            "duration_seconds": 300,
            "best_for": ["worry", "negative thoughts"],
            "best_time": ["morning", "afternoon"],
            "min_duration_minutes": 5
        },
        {
            "id": "reframe-2",
            "type": "reframe",
            "title": "Gratitude Practice",
            "duration_seconds": 240,
            "best_for": ["low mood", "rumination"],
            "best_time": ["evening"],
            "min_duration_minutes": 4
        }
    ],
    "walk": [
        {
            "id": "walk-1",
            "type": "walk",
            "title": "10-Minute Walk",
            "duration_seconds": 600,
            "best_for": ["physical tension", "mental clarity"],
            "best_time": ["morning", "afternoon"],
            "min_duration_minutes": 10
        },
        {
            "id": "walk-2",
            "type": "walk",
            "title": "Desk Stretches",
            "duration_seconds": 300,
            "best_for": ["stiffness", "attention"],
            "best_time": ["morning", "afternoon", "evening"],
            "min_duration_minutes": 5
        }
    ],
    "pause": [
        {
            "id": "pause-1",
            "type": "pause",
            "title": "5-Minute Meditation",
            "duration_seconds": 300,
            "best_for": ["stress", "focus"],
            "best_time": ["morning", "afternoon", "evening"],
            "min_duration_minutes": 5
        },
        {
            "id": "pause-2",
            "type": "pause",
            "title": "Mindful Observation",
            "duration_seconds": 180,
            "best_for": ["anxiety", "presence"],
            "best_time": ["afternoon"],
            "min_duration_minutes": 3
        }
    ],
    "journal": [
        {
            "id": "journal-1",
            "type": "journal",
            "title": "Stress Dump Journal",
            "duration_seconds": 600,
            "best_for": ["overwhelm", "clarity"],
            "best_time": ["evening"],
            "min_duration_minutes": 10
        },
        {
            "id": "journal-2",
            "type": "journal",
            "title": "Three Good Things",
            "duration_seconds": 300,
            "best_for": ["low mood", "gratitude"],
            "best_time": ["evening"],
            "min_duration_minutes": 5
        }
    ]
}


def get_recommended_interventions(
    current_stress: int,
    time_of_day: str,
    calendar_gap_minutes: int,
    past_ratings: List[InterventionRating]
) -> List[InterventionRecommendation]:
    """
    Recommend interventions based on current state, time of day, and availability.
    """
    recommendations = []

    # Determine intervention type based on stress level
    if current_stress >= 8:
        # High stress: recommend quick, immediate relief
        intervention_types = ["breathing", "pause"]
        reason_suffix = "for immediate stress relief"
    elif current_stress >= 6:
        # Moderate stress
        intervention_types = ["reframe", "walk", "breathing"]
        reason_suffix = "to manage current stress"
    else:
        # Low stress: any intervention works
        intervention_types = list(INTERVENTIONS_DB.keys())
        reason_suffix = "for general wellbeing"

    # Filter by available time
    max_duration = calendar_gap_minutes * 60
    if max_duration < 180:  # Less than 3 minutes
        # Only recommend very quick interventions
        filtered_interventions = []
        for itype in intervention_types:
            for interv in INTERVENTIONS_DB[itype]:
                if interv["duration_seconds"] <= max_duration:
                    filtered_interventions.append(interv)
    else:
        filtered_interventions = []
        for itype in intervention_types:
            for interv in INTERVENTIONS_DB[itype]:
                if time_of_day in interv["best_time"]:
                    if interv["duration_seconds"] <= max_duration:
                        filtered_interventions.append(interv)

    # If no interventions match, relax the time constraint
    if not filtered_interventions:
        for itype in intervention_types:
            filtered_interventions.extend(INTERVENTIONS_DB[itype][:1])

    # Score interventions based on past performance
    past_ratings_dict = {r.intervention_id: r.rating for r in past_ratings}

    scored_interventions = []
    for interv in filtered_interventions:
        score = past_ratings_dict.get(interv["id"], 3.0)  # Default to 3.0 if no rating
        scored_interventions.append((interv, score))

    # Sort by score (highest first)
    scored_interventions.sort(key=lambda x: x[1], reverse=True)

    # Return top 3
    for interv, score in scored_interventions[:3]:
        recommendations.append(
            InterventionRecommendation(
                id=interv["id"],
                type=interv["type"],
                title=interv["title"],
                reason=f"{interv['title']} {reason_suffix}",
                duration_seconds=interv["duration_seconds"]
            )
        )

    return recommendations


@router.post("/interventions")
async def recommend_interventions(request: InterventionRecommendationRequest) -> InterventionRecommendationResponse:
    """
    Recommend interventions based on current stress level, time of day, and calendar availability.
    """
    try:
        interventions = get_recommended_interventions(
            request.current_stress,
            request.time_of_day,
            request.calendar_gap_minutes,
            request.past_ratings
        )
        return InterventionRecommendationResponse(interventions=interventions)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error recommending interventions")
