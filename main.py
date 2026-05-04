import os
import json
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import google.generativeai as genai

app = FastAPI(title="Health Prediction Backend")

# Enable CORS so frontend can communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
# Get API key from environment variable (Never hardcode this before uploading to GitHub!)
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
 
@app.post("/upload-prescription")
async def upload_prescription(file: UploadFile = File(...)):
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")
        
    try:
        # Read the file contents
        content = await file.read()
        
        # Prepare the model (using the available 2.5 flash model)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = """
        Extract medical conditions from this prescription image.
        
        Return ONLY valid JSON:
        {
          "diabetes": true/false,
          "heart": true/false,
          "kidney": true/false,
          "anemia": true/false,
          "obesity": true/false,
          "liver": true/false
        }
        """
        
        # Call Gemini API
        response = model.generate_content([
            prompt,
            {"mime_type": file.content_type, "data": content}
        ])
        
        text = response.text
        print(f"--- Raw Gemini Response ---\n{text}\n---------------------------")
        
        # Safely extract JSON from the response (in case Gemini returns markdown or extra text)
        data = {}
        try:
            match = re.search(r'\{.*?\}', text, re.DOTALL)
            if match:
                json_str = match.group(0)
                data = json.loads(json_str)
        except Exception as e:
            print(f"Failed to parse JSON from Gemini response: {str(e)}")
            
        # Ensure all keys exist, fallback to False if parsing failed or key missing
        keys = ["diabetes", "heart", "kidney", "anemia", "obesity", "liver"]
        for k in keys:
            if k not in data or not isinstance(data[k], bool):
                data[k] = False
                
        return data
            
    except Exception as e:
        error_msg = str(e)
        
        # If it's a model not found error, let's dynamically list what models they DO have access to!
        if "404" in error_msg or "not found" in error_msg:
            try:
                available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
                error_msg += f"\n\nAvailable models for your API key: {', '.join(available_models)}"
            except Exception as inner_e:
                error_msg += f" (Could not fetch models: {str(inner_e)})"
                
        print(f"Error processing prescription: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Backend Error: {error_msg}")

# Serve the main index.html file at the root URL
@app.get("/")
async def root():
    index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diet_platform", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "diet_platform/index.html not found on the server. Please ensure the folder was uploaded correctly to GitHub."}

# Mount the static frontend files so FastAPI can serve the CSS and JS
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diet_platform")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir), name="static")
else:
    print(f"WARNING: Static directory not found at {static_dir}")
