"""
Saknny – Clustering Service Stub (Role B / Role D integration point)

This service defines the interface that Role D (Intelligence Layer) will implement.
Role B calls this service from API endpoints.
"""

from typing import List, Dict, Any

class RoommateClusteringService:
    """
    Stub – Role D will implement the actual clustering logic.
    See docs/role_d_clustering_handoff.md for the full specification.
    """

    def vectorize_answers(self, answers: Dict[str, str]) -> List[float]:
        """
        Convert raw q1–q11 answers into a numeric feature vector.
        """
        raise NotImplementedError("Role D: implement vectorization")

    def run_clustering(self, vectors: List[List[float]], k: int) -> Dict[str, Any]:
        """
        Run KMeans clustering.
        Returns a dict containing:
        - labels: List[int] mapping each vector to a cluster
        - centroids: List[List[float]] cluster centers
        - distances: List[float] distance of each vector to its centroid
        """
        raise NotImplementedError("Role D: implement clustering")

    def suggest_room_assignments(self, cluster_sizes: Dict[int, int], available_rooms: List[Dict[str, int]]) -> Dict[int, int]:
        """
        Match clusters to rooms by capacity.
        Returns Dict mapping cluster_label to room_id.
        """
        raise NotImplementedError("Role D: implement room matching")
