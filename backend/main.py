from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import re
from dotenv import load_dotenv
from groq import Groq

# Load environment variables, overriding existing ones so changes to .env take effect immediately
load_dotenv(override=True)

# Initialize FastAPI
app = FastAPI(title="The Paninian Code Engine API")

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for deployment compatibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# We will initialize the Groq client inside the endpoint or use a dependency to ensure
# it picks up the latest environment variables if the user modifies the .env file.

# Define request/response models
class CodeRequest(BaseModel):
    input_text: str

class CodeResponse(BaseModel):
    result: str

SYSTEM_PROMPT = """You are the Paninian Code Engine, a formal computational grammar system modeled after the principles of Panini's Ashtadhyayi. Your personality is precise and systematic, but you MUST speak in clear, plain, everyday English. Do not use dense linguistic jargon.

IMPORTANT RULE: You MUST provide the accurate Sanskrit equivalent words (in IAST transliteration) in the designated 'sanskrit_roots', 'sanskrit_nouns', 'sanskrit_affixes', and 'sanskrit_junctions' fields. 
However, for the English fields, do NOT apply Sanskrit grammar to English words. Analyze the English sentence using basic, easy-to-understand concepts (verbs, nouns, suffixes, syntax).

You MUST output your final response STRICTLY as a valid JSON object. Do not include any markdown formatting, backticks, or text outside the JSON object.

The JSON object must have exactly the following structure:
{
  "original_text": "Briefly restate the user's input",
  "reduced_text": "Provide a simple, stripped-down version of the sentence or code, keeping only the most essential meaning.",
  "sanskrit_reduced_text": {
    "devanagari": "Complete Sanskrit translation of the optimized sentence (in Devanagari script)",
    "romanized": "Complete Sanskrit translation of the optimized sentence (in Romanized IAST format)"
  },
  "dhatu": {
    "english_roots": ["List the core action verbs (e.g., 'run', 'assign')"],
    "sanskrit_roots": [{"devanagari": "Sanskrit dhatu in Devanagari", "romanized": "Romanized IAST"}],
    "english_nouns": ["List the main subjects/objects"],
    "sanskrit_nouns": [{"devanagari": "Sanskrit noun in Devanagari", "romanized": "Romanized IAST"}],
    "explanation": "Provide 2 to 3 very simple, clear sentences explaining what these core words mean in the context of the sentence."
  },
  "pratyaya": {
    "english_affixes": ["List the tense markers, modifiers, or adjectives"],
    "sanskrit_affixes": [{"devanagari": "Sanskrit affix in Devanagari", "romanized": "Romanized IAST"}],
    "state_changes": ["Detail what these modifiers do (e.g., 'changes it to past tense', 'makes it negative')"],
    "explanation": "Provide 2 to 3 simple sentences explaining how these modifiers alter the core meaning of the roots."
  },
  "sandhi": {
    "english_junctions": ["Explain simply how the English/code words fit together"],
    "sanskrit_junctions": [{"devanagari": "Sanskrit sandhi rule in Devanagari", "romanized": "Romanized IAST"}],
    "optimization": "Explain in simple terms why this sentence structure works or how it could be more direct."
  },
  "sutra": {
    "formal_rule": "State the basic grammatical or logical rule governing this input",
    "original_structure": "Show the original unoptimized structure",
    "changes_made": ["List the specific transformations applied"],
    "optimized_structure": "Show the final, optimized Paninian logic structure in English",
    "sanskrit_optimized_structure": {
      "devanagari": "Show the final, optimized Paninian structure translated into Sanskrit (Devanagari)",
      "romanized": "Show the final, optimized Paninian structure translated into Sanskrit (Romanized IAST)"
    }
  }
}"""

@app.post("/api/analyze", response_model=CodeResponse)
async def analyze_input(request: CodeRequest):
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your_groq_api_key_here":
            raise HTTPException(status_code=500, detail="GROQ_API_KEY is not properly configured in the .env file.")

        client = Groq(api_key=api_key)

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b", # Using a highly capable reasoning model available on your Groq key
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.input_text}
            ],
            temperature=0.2 # Lower temperature for more structured, analytical output
        )

        raw_response = response.choices[0].message.content
        
        # Aggressively extract JSON object from the response
        json_match = re.search(r'(\{.*\})', raw_response, re.DOTALL)
        if json_match:
            raw_response = json_match.group(1)
            
        # Validate that it's parseable JSON
        try:
            json.loads(raw_response)
        except json.JSONDecodeError:
            # Fallback if the engine completely failed to produce JSON
            raw_response = json.dumps({
                "error": True,
                "message": "The Paninian Engine failed to produce valid structured JSON. Raw output below:",
                "raw": raw_response
            })
            
        return CodeResponse(result=raw_response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "The Engine is operational."}
