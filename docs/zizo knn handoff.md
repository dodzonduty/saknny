# Role D Handoff: KMeans Clustering for Roommate Auto-Assignment

## Overview

We have introduced a new automatic assignment option for the admin panel to complement the existing manual assignment process. This feature groups compatible students using a KMeans clustering algorithm based on their answers to an 11-question compatibility questionnaire.

**Role A (Data Layer)** and **Role B (API Layer)** have completed the database schema and API endpoints. 
**Role D (Intelligence Layer)** is responsible for implementing the `RoommateClusteringService`.

---

## 1. Vectorization Spec

The questionnaire consists of 11 questions, all single choice. The answers are stored as a JSON object (e.g. `{"q1": "early_bird", "q2": "dim_light"}`).

You must implement the `vectorize_answers` method in `backend/app/services/ai/clustering.py` to convert this JSON into a numeric `List[float]`.

We recommend **One-Hot Encoding** for all 11 questions. There are approximately 28 possible choices in total, so the resulting feature vector will have ~28 dimensions. You may also apply weights to specific questions if domain logic dictates certain questions are more important than others.

---

## 2. Service Interface

You must implement the logic in the existing stub `backend/app/services/ai/clustering.py`. Do not change the method signatures as the API endpoints rely on them.

```python
from typing import List, Dict, Any

class RoommateClusteringService:

    def vectorize_answers(self, answers: Dict[str, str]) -> List[float]:
        """
        Convert raw q1–q11 answers into a numeric feature vector.
        """
        pass

    def run_clustering(self, vectors: List[List[float]], k: int) -> Dict[str, Any]:
        """
        Run KMeans clustering on the provided vectors.
        Return dict must contain:
        - labels: List[int] mapping each vector (in order) to a cluster label (0 to k-1).
        - centroids: List[List[float]] cluster centers.
        - distances: List[float] distance of each vector to its centroid.
        """
        pass

    def suggest_room_assignments(self, cluster_sizes: Dict[int, int], available_rooms: List[Dict[str, int]]) -> Dict[int, int]:
        """
        Match clusters to rooms by capacity.
        - cluster_sizes: mapping of cluster_label -> count of students
        - available_rooms: list of dicts {"room_id": X, "available_beds": Y}
        Returns Dict mapping cluster_label to room_id.
        """
        pass
```

---

## 3. Algorithm Recommendations

- **KMeans** via `scikit-learn` is the recommended algorithm. The `scikit-learn` package has been added to `requirements.txt`.
- When `k` is dynamic (the admin did not specify a forced `k_value`), the API will pass a suggested `k` based on the number of available rooms in the target dorm. However, if you implement internal validation (like silhouette score) to find an optimal `k`, you may override it.
- **Assignment Logic (`suggest_room_assignments`)**: We recommend a greedy approach: sort clusters by size descending, and sort available rooms by available beds descending, then assign the largest cluster to the largest room that fits it.

---

## 4. Integration & Database

The API endpoints handle all database reading and writing:
1. `POST /compatibility/responses` calls `vectorize_answers` and saves the resulting `feature_vector` into `compatibility_responses`.
2. `POST /admin/compatibility/cluster` retrieves all `feature_vector`s from the DB and calls `run_clustering`, then saves the results into `clustering_sessions` and `clustering_results`.
3. `GET /admin/compatibility/sessions/{id}/preview` calls `suggest_room_assignments`.

You do not need to interact with the database directly in this service.

## 5. Next Steps

1. Install dependencies: `pip install -r requirements.txt`.
2. Open `backend/app/services/ai/clustering.py`.
3. Replace the `NotImplementedError` stubs with the actual `scikit-learn` implementation.
4. Add unit tests for your vectorization and clustering logic in `backend/tests/`.
