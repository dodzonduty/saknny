from .base import BaseAIModel
from typing import Any, Dict
import io
from PIL import Image
import numpy as np


class DocumentQualityChecker(BaseAIModel):
    """AI model to check document image quality (sharpness, brightness, etc.)."""
    
    def __init__(self, min_sharpness: float = 100.0, min_brightness: float = 30.0, max_brightness: float = 220.0):
        self.min_sharpness = min_sharpness
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness
    
    def process(self, input_data: bytes) -> Dict[str, Any]:
        """
        Process an image file (bytes) and return quality metrics.
        
        Args:
            input_data: Image file as bytes
            
        Returns:
            Dict with quality results:
                - is_acceptable: bool
                - sharpness: float
                - brightness: float
                - issues: list of str
        """
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(input_data))
            # Convert to grayscale for analysis
            gray_image = image.convert("L")
            np_image = np.array(gray_image)
            
            # Calculate sharpness using Laplacian variance
            sharpness = self._calculate_sharpness(np_image)
            
            # Calculate brightness
            brightness = self._calculate_brightness(np_image)
            
            # Check for issues
            issues = []
            if sharpness < self.min_sharpness:
                issues.append("Image is blurry or out of focus")
            if brightness < self.min_brightness:
                issues.append("Image is too dark")
            if brightness > self.max_brightness:
                issues.append("Image is too bright")
            
            return {
                "is_acceptable": len(issues) == 0,
                "sharpness": round(sharpness, 2),
                "brightness": round(brightness, 2),
                "issues": issues
            }
        except Exception as e:
            return {
                "is_acceptable": False,
                "sharpness": 0.0,
                "brightness": 0.0,
                "issues": [f"Failed to process image: {str(e)}"]
            }
    
    def _calculate_sharpness(self, np_image: np.ndarray) -> float:
        """Calculate sharpness using Laplacian variance."""
        # Compute Laplacian
        laplacian = cv2.Laplacian(np_image, cv2.CV_64F)
        return laplacian.var()
    
    def _calculate_brightness(self, np_image: np.ndarray) -> float:
        """Calculate average brightness of the image."""
        return np.mean(np_image)


# Import cv2 here for lazy loading, or make sure it's available
try:
    import cv2
except ImportError:
    cv2 = None
