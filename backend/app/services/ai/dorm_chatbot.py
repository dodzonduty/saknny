import os
import traceback
from google import genai
from typing import Dict, Any

from backend.app.core.config import settings
from backend.app.services.ai.base import BaseAIModel

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------
# Directory tree from this file:
#   backend/app/services/ai/dorm_chatbot.py   ← __file__
#   backend/app/services/ai/                   ← dirname(__file__)
#   backend/app/services/                      ← ../
#   backend/app/                               ← ../../
#   backend/                                   ← ../../../
#   <project_root>/                            ← ../../../../   (saknny/)
#   <project_root>/datasets/                   ← ../../../../datasets/
# ---------------------------------------------------------------------------
_PROJECT_ROOT = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..")
)
_REGULATIONS_PATH = os.path.join(_PROJECT_ROOT, "datasets", "regulations.txt")


def _load_regulations() -> str:
    """
    Read the dorm regulations knowledge base from disk.

    Returns the file content as a string.
    Raises RuntimeError with a detailed message if the file cannot be found,
    printing the resolved path to the terminal so operators can diagnose quickly.
    """
    resolved = os.path.abspath(_REGULATIONS_PATH)
    print(f"[DormChatbot] Loading regulations from: {resolved}")

    if not os.path.isfile(resolved):
        msg = (
            f"[DormChatbot] ERROR — regulations.txt not found at: {resolved}\n"
            f"  Project root resolved to: {_PROJECT_ROOT}\n"
            "  Ensure datasets/regulations.txt exists relative to the project root."
        )
        print(msg)
        raise RuntimeError(msg)

    try:
        with open(resolved, "r", encoding="utf-8") as fh:
            content = fh.read().strip()
        print(f"[DormChatbot] Regulations loaded successfully ({len(content):,} chars).")
        return content
    except OSError as exc:
        msg = f"[DormChatbot] ERROR — Could not read regulations.txt: {exc}"
        print(msg)
        raise RuntimeError(msg) from exc


# Load once at module import time so the cost is paid only once per worker.
try:
    _REGULATIONS_TEXT = _load_regulations()
except RuntimeError as _load_err:
    # Surface a clear sentinel value; DormChatbot.__init__ will re-raise.
    _REGULATIONS_TEXT = None  # type: ignore[assignment]
    _LOAD_ERROR = str(_load_err)
else:
    _LOAD_ERROR = None

# ---------------------------------------------------------------------------
# System instruction (built once from the loaded text)
# ---------------------------------------------------------------------------
_SYSTEM_INSTRUCTION = (
    """You are Sakny Assistant — the official AI helper for Benha University Housing Administration (Saknny).

Your ONLY knowledge source is the official dorm regulations document provided below between the markers.

=== BEGIN REGULATIONS DOCUMENT ===
{regulations}
=== END REGULATIONS DOCUMENT ===

Strict rules you must follow:
1. ONLY answer questions that can be answered using the regulations document above.
2. If a question is outside the scope of the document, respond ONLY with the following exact fallback message and nothing else:
   "عذرًا، لا تتوفر لديّ معلومات كافية للإجابة على هذا السؤال. يرجى التواصل مع إدارة المدينة الجامعية مباشرةً للاستفسار."
3. Answer in the same language the user asks in (Arabic or English).
4. Be concise, precise, and formal in tone.
5. Never fabricate rules, numbers, or procedures that are not in the document.
6. Never answer questions about topics unrelated to university housing regulations (e.g., academic courses, politics, general knowledge).
"""
).format(regulations=_REGULATIONS_TEXT or "")


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------

class DormChatbot(BaseAIModel):
    """
    Stateless RAG chatbot that answers student questions about university
    housing regulations using the Gemini API and the regulations.txt knowledge base.
    """

    FALLBACK_RESPONSE = (
        "عذرًا، لا تتوفر لديّ معلومات كافية للإجابة على هذا السؤال. "
        "يرجى التواصل مع إدارة المدينة الجامعية مباشرةً للاستفسار."
    )

    def __init__(self):
        # Guard: re-raise file-load errors with a clear message
        if _LOAD_ERROR is not None:
            raise RuntimeError(
                f"DormChatbot could not initialise — regulations file failed to load: {_LOAD_ERROR}"
            )

        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured in environment variables.")

        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-flash"
        self.system_instruction = _SYSTEM_INSTRUCTION

    def process(self, input_data: str) -> Dict[str, Any]:
        """
        Process a student question and return an answer grounded in the
        regulations knowledge base.

        Args:
            input_data (str): The student's question.

        Returns:
            Dict[str, Any]: {'success': True, 'answer': str}
                         or {'success': False, 'error': str}
        """
        if not input_data or not input_data.strip():
            return {"success": False, "error": "Empty message received."}

        try:
            config = genai.types.GenerateContentConfig(
                system_instruction=self.system_instruction,
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=input_data.strip(),
                config=config,
            )
            answer = response.text.strip() if response.text else self.FALLBACK_RESPONSE
            return {"success": True, "answer": answer}

        except Exception as exc:
            # Print full traceback to backend terminal for operator visibility
            print("[DormChatbot] Gemini API call failed:")
            traceback.print_exc()
            return {"success": False, "error": str(exc)}
