import requests
from config import settings
import logging

logger = logging.getLogger(__name__)

def generate_completion(messages: list) -> str:
    """Calls the NVIDIA NIM API to generate a completion using OpenAI compatible endpoint."""
    if not settings.NVIDIA_API_KEY or settings.NVIDIA_API_KEY == "your-nvidia-api-key-here":
        return "System Error: NVIDIA API Key is not configured. Please contact the administrator."

    headers = {
        "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Using the standard OpenAI chat completions endpoint for NVIDIA NIM
    # The prompt specified https://build.nvidia.com... but the actual API endpoint for inference is usually:
    url = "https://integrate.api.nvidia.com/v1/chat/completions"

    payload = {
        "model": settings.NVIDIA_MODEL,
        "messages": messages,
        "max_tokens": 512,
        "temperature": 0.6,
        "top_p": 0.95
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 410:
            return "System Error (410): The AI model configured is deprecated or unavailable. Please check the model name."
            
        response.raise_for_status()
        data = response.json()
        
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0]["message"]["content"]
        else:
            return "System Error: Received malformed response from AI provider."
            
    except requests.exceptions.HTTPError as e:
        logger.error(f"NVIDIA API HTTP Error: {e.response.text}")
        return f"System Error: API request failed with status {e.response.status_code}."
    except requests.exceptions.RequestException as e:
        logger.error(f"NVIDIA API Network Error: {e}")
        return "System Error: Network failure communicating with AI service."
    except Exception as e:
        logger.error(f"Unexpected LLM error: {e}")
        return "System Error: An unexpected failure occurred in the AI integration layer." 
