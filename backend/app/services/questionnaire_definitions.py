"""
Saknny – Fixed Questionnaire Definitions (Role B: API Layer)

This module defines the hardcoded compatibility questions 
based on docs/roommate_matching_questionnaire_v3.pdf.

There are 11 questions, all single_choice type.
"""

COMPATIBILITY_QUESTIONS = [
    {
        "code": "q1",
        "category": "Sleep & Daily Routine",
        "text": "What is your typical sleep schedule?",
        "choices": [
            {"value": "early_bird", "label": "Early Bird (I sleep early and wake up early)"},
            {"value": "night_owl", "label": "Night Owl (I stay up late and sleep in late)"},
            {"value": "irregular", "label": "Irregular (My schedule changes constantly)"},
        ],
    },
    {
        "code": "q2",
        "category": "Sleep & Daily Routine",
        "text": "How do you prefer the room lighting when you sleep?",
        "choices": [
            {"value": "pitch_black", "label": "Pitch Black (I need total darkness)"},
            {"value": "dim_light", "label": "Dim Light (I prefer a nightlight or some ambient light)"},
            {"value": "doesnt_matter", "label": "Doesn't matter (I can sleep with lights on)"},
        ],
    },
    {
        "code": "q3",
        "category": "Sleep & Daily Routine",
        "text": "How do you handle morning alarms?",
        "choices": [
            {"value": "wake_instantly", "label": "I wake up instantly on the first alarm."},
            {"value": "snooze_multiple", "label": "I hit snooze multiple times before waking up."},
        ],
    },
    {
        "code": "q4",
        "category": "Cleanliness & Organization",
        "text": "How would you describe your room neatness?",
        "choices": [
            {"value": "very_neat", "label": "Very Neat (Everything must be in its place at all times)"},
            {"value": "average", "label": "Average (Reasonably clean, but a little clutter is fine)"},
            {"value": "messy", "label": "Messy (I don't mind a disorganized room)"},
        ],
    },
    {
        "code": "q5",
        "category": "Cleanliness & Organization",
        "text": "How often do you prefer to deep-clean the room?",
        "choices": [
            {"value": "daily", "label": "Daily / Every few days"},
            {"value": "weekly", "label": "Once a week"},
            {"value": "monthly", "label": "Once a month / Only when absolutely necessary"},
        ],
    },
    {
        "code": "q6",
        "category": "Study Habits & Social Life",
        "text": "What is your preferred study environment in the room?",
        "choices": [
            {"value": "absolute_silence", "label": "Absolute Silence (I cannot focus with any noise)"},
            {"value": "low_noise", "label": "Low Noise (I can study with background music or light chatter)"},
            {"value": "outside_room", "label": "I prefer studying outside the room (Library, cafés, etc.)"},
        ],
    },
    {
        "code": "q7",
        "category": "Study Habits & Social Life",
        "text": "What is your policy regarding inviting guests/friends over to the room?",
        "choices": [
            {"value": "no_guests", "label": "No guests allowed inside the room."},
            {"value": "daytime_only", "label": "Daytime guests are fine, but no overnight stays."},
            {"value": "anytime_coordinated", "label": "Friends are welcome anytime, as long as it's coordinated."},
        ],
    },
    {
        "code": "q8",
        "category": "Lifestyle & Personality",
        "text": "How do you feel about sharing personal belongings (e.g., food, clothes, electronics)?",
        "choices": [
            {"value": "no_sharing", "label": "Strictly no sharing (What's mine is mine)"},
            {"value": "ask_permission", "label": "Willing to share certain things after asking permission"},
            {"value": "open_sharing", "label": "Open sharing (I don't mind sharing most things)"},
        ],
    },
    {
        "code": "q9",
        "category": "Room Comfort (Temperature)",
        "text": "What is your preferred room temperature?",
        "choices": [
            {"value": "cold", "label": "Cold (I love heavy Air Conditioning / Fan)"},
            {"value": "moderate", "label": "Moderate (Balanced temperature)"},
            {"value": "warm", "label": "Warm (I easily get cold and prefer less or no AC)"},
        ],
    },
    {
        "code": "q10",
        "category": "Academic & Program Compatibility",
        "text": "Do you prefer a roommate who is studying in the same department/major as you?",
        "choices": [
            {"value": "yes_same_dept", "label": "Yes, I prefer someone from the same department/major"},
            {"value": "doesnt_matter", "label": "No, it doesn't matter to me."},
        ],
    },
    {
        "code": "q11",
        "category": "Academic & Program Compatibility",
        "text": "Which type of university program building do you prefer to reside in?",
        "choices": [
            {"value": "credit_hours", "label": "Credit Hours Program building"},
            {"value": "mainstream", "label": "Mainstream Program building"},
        ],
    },
]

def get_valid_choices() -> dict[str, set[str]]:
    """Returns a dict mapping question code to a set of valid values."""
    return {
        q["code"]: {choice["value"] for choice in q["choices"]}
        for q in COMPATIBILITY_QUESTIONS
    }
