"""
CampusOps Local Incident Similarity & Duplicate Detection Engine
Zero-cost, 100% offline, deterministic in-memory TF-IDF / Token Cosine Similarity.
Evaluates semantic duplication without requiring external runtime model APIs or downloads.
"""

import math
import re
from typing import List, Dict, Any, Tuple

# Common stop words to exclude from TF-IDF vectorization
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
    "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", 
    "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", 
    "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", 
    "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", 
    "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", 
    "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", 
    "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", 
    "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", 
    "with", "would", "you", "your", "yours", "yourself", "yourselves"
}


def tokenize(text: str) -> List[str]:
    """Tokenize text into lowercase alphanumeric words, filtering stopwords."""
    words = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", text.lower())
    return [w for w in words if w not in STOP_WORDS]


def compute_tf(tokens: List[str]) -> Dict[str, float]:
    """Compute term frequencies for a token list."""
    tf: Dict[str, float] = {}
    if not tokens:
        return tf
    total = len(tokens)
    for token in tokens:
        tf[token] = tf.get(token, 0.0) + 1.0
    for token in tf:
        tf[token] = tf[token] / total
    return tf


def cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """Compute cosine similarity between two sparse term-frequency vectors."""
    if not vec_a or not vec_b:
        return 0.0

    common_keys = set(vec_a.keys()).intersection(set(vec_b.keys()))
    if not common_keys:
        return 0.0

    dot_product = sum(vec_a[k] * vec_b[k] for k in common_keys)
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return dot_product / (norm_a * norm_b)


class IncidentSimilarityEngine:
    """
    In-memory duplicate and correlation engine.
    Finds existing incidents that match an incoming report.
    """

    @classmethod
    def find_duplicates(
        cls,
        new_text: str,
        existing_incidents: List[Dict[str, Any]],
        threshold: float = 0.35,
    ) -> List[Dict[str, Any]]:
        """
        Compare new_text against existing_incidents descriptions and titles.
        Returns matches above threshold, sorted by similarity descending.
        """
        new_tokens = tokenize(new_text)
        new_vec = compute_tf(new_tokens)

        matches = []
        for inc in existing_incidents:
            title = inc.get("title", "")
            desc = inc.get("description", "")
            combined = f"{title} {desc} {inc.get('room_number', '')}"

            existing_tokens = tokenize(combined)
            existing_vec = compute_tf(existing_tokens)

            sim = cosine_similarity(new_vec, existing_vec)
            if sim >= threshold:
                matches.append({
                    "incident_id": inc.get("id"),
                    "incident_number": inc.get("incident_number"),
                    "title": title,
                    "similarity_score": round(sim, 3),
                    "status": inc.get("status"),
                    "room_number": inc.get("room_number"),
                    "is_duplicate_candidate": sim >= 0.50,
                })

        matches.sort(key=lambda m: m["similarity_score"], reverse=True)
        return matches

