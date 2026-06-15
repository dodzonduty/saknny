import json
import traceback
from typing import Any, Dict

from google import genai

from backend.app.core.config import settings
from backend.app.services.ai.base import BaseAIModel

# ---------------------------------------------------------------------------
# System instruction (fixed, as specified in governance)
# ---------------------------------------------------------------------------
_SYSTEM_INSTRUCTION = (
    "You are an expert Facility Maintenance Classifier for a student housing platform. "
    "Analyze maintenance requests (Title + Description) and assign one of these four priorities: "
    "Urgent, High, Medium, Low.\n"
    "Rules: If the description suggests any immediate threat to life, safety, or severe property damage "
    "(e.g., gas, smoke, flooding), you MUST classify it as 'Urgent'. "
    "When in doubt, always choose the higher priority level.\n"
    "Return ONLY a valid JSON object with a single key 'priority'. "
    'Example: {"priority": "High"}.'
)

# Valid priority values that map to the DB CheckConstraint
_VALID_PRIORITIES = {"urgent", "high", "medium", "low"}
_FALLBACK_PRIORITY = "medium"


class TicketPriorityClassifier(BaseAIModel):
    """
    Gemini-powered classifier that determines the priority of a maintenance
    ticket from its title and description.

    Mirrors the DormChatbot pattern: stateless, reuses settings.GEMINI_API_KEY,
    and always returns a safe fallback so ticket submission never fails due to AI.
    """

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured in environment variables.")

        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-flash"
        self.system_instruction = _SYSTEM_INSTRUCTION

    def process(self, input_data: Dict[str, str]) -> Dict[str, Any]:
        """
        Classify the priority of a maintenance ticket.

        Args:
            input_data: dict with keys ``title`` and ``description``.

        Returns:
            dict with key ``priority`` — one of "urgent", "high", "medium", "low".
            On any error the fallback ``{"priority": "medium"}`` is returned so
            the caller can always proceed to save the ticket.
        """
        title = (input_data.get("title") or "").strip()
        description = (input_data.get("description") or "").strip()

        if not title and not description:
            print("[TicketClassifier] WARNING — empty input; using fallback priority.")
            return {"priority": _FALLBACK_PRIORITY}

        user_message = f"Title: {title}\nDescription: {description}"

        try:
            config = genai.types.GenerateContentConfig(
                system_instruction=self.system_instruction,
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_message,
                config=config,
            )

            raw_text = (response.text or "").strip()
            print(f"[TicketClassifier] Raw Gemini response: {raw_text!r}")

            priority = self._parse_priority(raw_text)
            print(f"[TicketClassifier] Classified priority: {priority!r}")
            return {"priority": priority}

        except Exception:
            print("[TicketClassifier] Gemini API call failed — using fallback priority:")
            traceback.print_exc()
            return {"priority": _FALLBACK_PRIORITY}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _parse_priority(self, raw_text: str) -> str:
        """
        Extract and normalise the priority value from the model's raw text.

        Strategy (in order):
        1. Try to parse the whole response as JSON.
        2. If that fails, extract the first JSON object found in the text.
        3. If still no luck, scan the text for a known priority keyword.
        4. Fall back to 'medium'.
        """
        # 1. Direct JSON parse
        try:
            data = json.loads(raw_text)
            priority = str(data.get("priority", "")).strip().lower()
            if priority in _VALID_PRIORITIES:
                return priority
        except (json.JSONDecodeError, AttributeError):
            pass

        # 2. Extract first {...} block from response (handles markdown fences etc.)
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                data = json.loads(raw_text[start:end])
                priority = str(data.get("priority", "")).strip().lower()
                if priority in _VALID_PRIORITIES:
                    return priority
            except (json.JSONDecodeError, AttributeError):
                pass

        # 3. Keyword scan (last resort before fallback)
        lower_text = raw_text.lower()
        for candidate in ("urgent", "high", "medium", "low"):
            if candidate in lower_text:
                return candidate

        # 4. Fallback
        print(
            f"[TicketClassifier] WARNING — could not parse priority from: {raw_text!r}. "
            f"Defaulting to '{_FALLBACK_PRIORITY}'."
        )
        return _FALLBACK_PRIORITY
