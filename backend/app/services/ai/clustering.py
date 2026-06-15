import numpy as np
from typing import List, Dict, Any
from sklearn.cluster import KMeans

from backend.app.services.questionnaire_definitions import COMPATIBILITY_QUESTIONS

class RoommateClusteringService:
    """
    Role D: Intelligence Layer Implementation for Roommate Auto-Assignment
    """

    def vectorize_answers(self, answers: Dict[str, str]) -> List[float]:
        """
        Convert raw q1–q11 answers into a numeric feature vector using One-Hot Encoding.
        """
        vector = []
        
        # Apply weighting based on domain rules:
        # User requested: "Sleep and study preferences follow as equally weighted secondary factors."
        # Note: "Smoking" question was requested but does not exist in the COMPATIBILITY_QUESTIONS schema.
        # We will heavily weight Sleep (q1, q2, q3) and Study (q6, q7).
        
        weight_map = {
            "q1": 2.0, "q2": 2.0, "q3": 2.0,  # Sleep
            "q6": 2.0, "q7": 2.0,             # Study
        }

        for q in COMPATIBILITY_QUESTIONS:
            q_code = q["code"]
            weight = weight_map.get(q_code, 1.0)
            
            user_answer = answers.get(q_code)
            for choice in q["choices"]:
                if user_answer == choice["value"]:
                    vector.append(1.0 * weight)
                else:
                    vector.append(0.0)
                    
        return vector

    def run_clustering(self, vectors: List[List[float]], k: int) -> Dict[str, Any]:
        """
        Run KMeans clustering on the provided vectors.
        """
        if not vectors:
            return {"labels": [], "centroids": [], "distances": []}
            
        X = np.array(vectors)
        n_samples = len(X)
        
        # Ensure k does not exceed number of samples
        actual_k = min(k, n_samples)
        
        # Run KMeans
        kmeans = KMeans(n_clusters=actual_k, random_state=42, n_init=10)
        kmeans.fit(X)
        
        labels = kmeans.labels_.tolist()
        centroids = kmeans.cluster_centers_.tolist()
        
        # Compute Euclidean distance from each point to its assigned centroid
        distances = []
        for i, vector in enumerate(X):
            centroid = kmeans.cluster_centers_[labels[i]]
            dist = float(np.linalg.norm(vector - centroid))
            distances.append(dist)
            
        return {
            "labels": labels,
            "centroids": centroids,
            "distances": distances
        }

    def suggest_room_assignments(self, cluster_sizes: Dict[int, int], available_rooms: List[Dict[str, int]]) -> Dict[int, int]:
        """
        Greedy Match: clusters to rooms by capacity.
        Note: Interface strictly maps Dict[cluster_label, room_id] meaning 1 cluster -> 1 room.
        Splitting a cluster to multiple rooms is not supported by the API layer, so any overflow
        students will automatically be skipped by the API and left for manual assignment.
        """
        # Sort clusters by size descending
        sorted_clusters = sorted(cluster_sizes.items(), key=lambda x: x[1], reverse=True)
        
        # Sort rooms by capacity descending
        sorted_rooms = sorted(available_rooms, key=lambda x: x["available_beds"], reverse=True)
        
        assignments = {}
        used_rooms = set()
        
        for cluster_label, size in sorted_clusters:
            for room in sorted_rooms:
                room_id = room["room_id"]
                if room_id in used_rooms:
                    continue
                
                # Assign to the first room that can fit the entire cluster, OR
                # if no room can fit it entirely, assign to the largest available room.
                # Since the API skips overflow students, they will just be skipped.
                assignments[cluster_label] = room_id
                used_rooms.add(room_id)
                break
                
        return assignments
