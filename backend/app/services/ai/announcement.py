from google import genai
from typing import Dict, Any

from backend.app.core.config import settings
from backend.app.services.ai.base import BaseAIModel


class AnnouncementGenerator(BaseAIModel):
    """
    AI Model that expands short administrative notes into formal announcements
    using the Gemini API.
    """

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured in environment variables.")
        
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-flash"
        
        self.system_instruction = (
            "You are the formal University Housing Administration for Sakkny. "
            "Your task is to take short, informal notes from an administrator and expand them "
            "into a complete, formally worded announcement in the appropriate institutional tone. "
            "The announcement should be clear, professional, and authoritative. "
            "Do not include placeholders for names/dates unless explicitly mentioned. "
            "Always sign off the announcement with:\n\nRegards,\nSakkny Admin"
        )

    def process(self, input_data: str) -> Dict[str, Any]:
        """
        Process the draft text and return the formal announcement.
        
        Args:
            input_data (str): The short draft text to expand.
            
        Returns:
            Dict[str, Any]: Dictionary containing the 'formal_text' or 'error'
        """
        try:
            config = genai.types.GenerateContentConfig(
                system_instruction=self.system_instruction,
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=input_data,
                config=config,
            )
            return {
                "success": True,
                "formal_text": response.text.strip()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
