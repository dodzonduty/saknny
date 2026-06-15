import pytest
import numpy as np
from backend.app.services.ai.clustering import RoommateClusteringService
from backend.app.services.questionnaire_definitions import get_valid_choices

def test_vectorize_answers():
    service = RoommateClusteringService()
    
    # Mock some answers based on the valid choices
    answers = {
        "q1": "early_bird",
        "q2": "pitch_black",
        "q3": "wake_instantly",
        "q4": "very_neat",
        "q5": "daily",
        "q6": "absolute_silence",
        "q7": "no_guests",
        "q8": "no_sharing",
        "q9": "cold",
        "q10": "yes_same_dept",
        "q11": "credit_hours"
    }
    
    vector = service.vectorize_answers(answers)
    
    # Check that vector is created
    assert isinstance(vector, list)
    assert len(vector) > 11  # One hot encoding should expand it to ~28
    
    # Check that sleep (q1, q2, q3) and study (q6, q7) have weight 2.0
    # The max value should be 2.0
    assert max(vector) == 2.0
    
def test_run_clustering():
    service = RoommateClusteringService()
    
    # Mock vectors for 5 students
    vectors = [
        [1.0, 0.0, 2.0, 0.0] * 7,
        [1.0, 0.0, 2.0, 0.0] * 7,
        [0.0, 1.0, 0.0, 2.0] * 7,
        [0.0, 1.0, 0.0, 2.0] * 7,
        [1.0, 0.0, 2.0, 0.0] * 7,
    ]
    
    k = 2
    result = service.run_clustering(vectors, k)
    
    assert "labels" in result
    assert "centroids" in result
    assert "distances" in result
    
    assert len(result["labels"]) == 5
    assert len(result["distances"]) == 5
    assert len(result["centroids"]) == 2

def test_suggest_room_assignments():
    service = RoommateClusteringService()
    
    cluster_sizes = {
        0: 4,
        1: 2
    }
    
    available_rooms = [
        {"room_id": 101, "available_beds": 2},
        {"room_id": 102, "available_beds": 4},
        {"room_id": 103, "available_beds": 3}
    ]
    
    assignments = service.suggest_room_assignments(cluster_sizes, available_rooms)
    
    # Cluster 0 has 4 students, should go to 102 (the only one that fits, or greedy largest)
    assert assignments[0] == 102
    # Cluster 1 has 2 students, should go to 103 or 101
    assert assignments[1] in [101, 103]
