"""
Cursor workflow helper — reads GEMINI_API_KEY from environment/.env via dotenv.
Does not write or modify .env or any Antigravity credentials files.
"""
from __future__ import annotations

import os
import sys

from dotenv import load_dotenv

load_dotenv()

# Newer models first; script tries each until one works.
DEFAULT_MODEL_CANDIDATES = (
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
)


def get_api_key() -> str:
    key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not key:
        print(
            "ERROR: GEMINI_API_KEY is missing.\n"
            "Create or update your local .env yourself (we do not edit it):\n"
            "  GEMINI_API_KEY=your_key_from_https://aistudio.google.com/apikey",
            file=sys.stderr,
        )
        sys.exit(1)
    return key


def configure_genai():
    import google.generativeai as genai

    genai.configure(api_key=get_api_key())
    return genai


def model_candidates() -> list[str]:
    override = (os.environ.get("GEMINI_MODEL") or "").strip()
    if override:
        return [override, *DEFAULT_MODEL_CANDIDATES]
    return list(DEFAULT_MODEL_CANDIDATES)


def create_model(genai_module, model_name: str):
    return genai_module.GenerativeModel(model_name)


def generate_with_fallback(genai_module, parts, generation_config=None):
    """Try each model name until generate_content succeeds."""
    last_error = None
    for name in model_candidates():
        try:
            model = create_model(genai_module, name)
            if generation_config:
                return model.generate_content(parts, generation_config=generation_config), name
            return model.generate_content(parts), name
        except Exception as e:
            last_error = e
            err = str(e).lower()
            if "api_key" in err or "api key" in err or "expired" in err:
                raise RuntimeError(
                    "Gemini API key invalid or expired. Renew at "
                    "https://aistudio.google.com/apikey and update .env manually."
                ) from e
            continue
    raise RuntimeError(f"No working Gemini model. Last error: {last_error}")


def list_generative_models() -> None:
    genai = configure_genai()
    print("Models supporting generateContent:")
    for m in genai.list_models():
        if "generateContent" in getattr(m, "supported_generation_methods", []):
            print(" ", m.name)
