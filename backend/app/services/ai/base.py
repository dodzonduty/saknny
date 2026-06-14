from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAIModel(ABC):
    """Base class for all AI models in the Saknny system."""
    
    @abstractmethod
    def process(self, input_data: Any) -> Dict[str, Any]:
        """Process input data and return results."""
        pass
