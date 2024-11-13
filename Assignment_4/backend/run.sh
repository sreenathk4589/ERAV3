#!/bin/bash
# Activate virtual environment
source venv/bin/activate  # On Windows, use: .\venv\Scripts\activate

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000 