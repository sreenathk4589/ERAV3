from fastapi import FastAPI, UploadFile, File, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import os
from .preprocessing import preprocess_text
from .augmentation import augment_text

app = FastAPI()
templates = Jinja2Templates(directory="app/templates")

# Store the current state of the text
class TextState:
    original_text = ""
    preprocessed_text = ""
    augmented_text = ""

text_state = TextState()

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "original_text": text_state.original_text,
            "preprocessed_text": text_state.preprocessed_text,
            "augmented_text": text_state.augmented_text,
        }
    )

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    text_state.original_text = content.decode()
    text_state.preprocessed_text = ""
    text_state.augmented_text = ""
    return {"text": text_state.original_text[:500] + "..." if len(text_state.original_text) > 500 else text_state.original_text}

@app.post("/preprocess")
async def preprocess():
    if not text_state.original_text:
        return {"error": "Please upload a file first"}
    text_state.preprocessed_text = preprocess_text(text_state.original_text)
    return {"text": text_state.preprocessed_text[:500] + "..." if len(text_state.preprocessed_text) > 500 else text_state.preprocessed_text}

@app.post("/augment")
async def augment():
    text_to_augment = text_state.preprocessed_text if text_state.preprocessed_text else text_state.original_text
    if not text_to_augment:
        return {"error": "Please upload a file first"}
    text_state.augmented_text = augment_text(text_to_augment)
    return {"text": text_state.augmented_text[:500] + "..." if len(text_state.augmented_text) > 500 else text_state.augmented_text} 